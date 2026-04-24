"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;
function makeRefreshToken() {
    return crypto_1.default.randomBytes(64).toString('hex');
}
async function authRoutes(server) {
    // ─── POST /api/auth/login ─────────────────────────────────
    server.post('/login', async (req, reply) => {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
            if (!user)
                return reply.code(401).send({ error: 'Invalid credentials' });
            if (!user.isActive)
                return reply.code(403).send({ error: 'Account is deactivated' });
            const valid = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!valid)
                return reply.code(401).send({ error: 'Invalid credentials' });
            // Access token (15 min)
            const accessToken = server.jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
            // Refresh token (7 days) — stored in DB
            const rawToken = makeRefreshToken();
            const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
            await db_1.db.insert(schema_1.refreshTokens).values({
                id: (0, uuid_1.v4)(), userId: user.id, token: rawToken, expiresAt,
            });
            // Set refresh token as HTTP-only cookie
            reply.setCookie('refresh_token', rawToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/auth',
                maxAge: REFRESH_DAYS * 24 * 60 * 60,
            });
            return reply.send({
                accessToken,
                user: { id: user.id, email: user.email, role: user.role, name: user.name },
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Login failed' });
        }
    });
    // ─── POST /api/auth/refresh ───────────────────────────────
    server.post('/refresh', async (req, reply) => {
        try {
            const rawToken = req.cookies?.refresh_token;
            if (!rawToken)
                return reply.code(401).send({ error: 'No refresh token' });
            const [stored] = await db_1.db
                .select()
                .from(schema_1.refreshTokens)
                .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.token, rawToken))
                .limit(1);
            if (!stored)
                return reply.code(401).send({ error: 'Invalid refresh token' });
            if (new Date() > stored.expiresAt)
                return reply.code(401).send({ error: 'Refresh token expired' });
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, stored.userId)).limit(1);
            if (!user || !user.isActive)
                return reply.code(403).send({ error: 'Account not active' });
            // Rotate token — delete old, issue new
            await db_1.db.delete(schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.id, stored.id));
            const newRaw = makeRefreshToken();
            const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
            await db_1.db.insert(schema_1.refreshTokens).values({ id: (0, uuid_1.v4)(), userId: user.id, token: newRaw, expiresAt });
            reply.setCookie('refresh_token', newRaw, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/auth',
                maxAge: REFRESH_DAYS * 24 * 60 * 60,
            });
            const accessToken = server.jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
            return reply.send({ accessToken });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Token refresh failed' });
        }
    });
    // ─── POST /api/auth/logout ────────────────────────────────
    server.post('/logout', async (req, reply) => {
        try {
            const rawToken = req.cookies?.refresh_token;
            if (rawToken) {
                await db_1.db.delete(schema_1.refreshTokens).where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.token, rawToken));
            }
            reply.clearCookie('refresh_token', { path: '/api/auth' });
            return reply.send({ message: 'Logged out' });
        }
        catch {
            return reply.send({ message: 'Logged out' });
        }
    });
    // ─── POST /api/auth/forgot-password ──────────────────────
    server.post('/forgot-password', async (req, reply) => {
        try {
            const { email } = zod_1.z.object({ email: zod_1.z.string().email() }).parse(req.body);
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
            // Always respond 200 to prevent email enumeration
            if (!user)
                return reply.send({ message: 'If that email exists, a reset link was sent.' });
            // Generate a short-lived reset token (30 min)
            const resetToken = server.jwt.sign({ id: user.id, purpose: 'password-reset' }, { expiresIn: '30m' });
            const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            // Import email service and send
            try {
                const { sendPasswordReset } = await Promise.resolve().then(() => __importStar(require('../services/emailService')));
                await sendPasswordReset({ email: user.email, name: user.name, resetLink });
            }
            catch (emailErr) {
                server.log.warn(emailErr, 'Email send failed (check SMTP config):');
            }
            return reply.send({ message: 'If that email exists, a reset link was sent.' });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Request failed' });
        }
    });
}
