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
exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const grades_1 = __importDefault(require("./routes/grades"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const staff_1 = __importDefault(require("./routes/staff"));
const financials_1 = __importDefault(require("./routes/financials"));
const auditLog_1 = __importDefault(require("./plugins/auditLog"));
const csv_1 = __importDefault(require("./routes/csv"));
const upload_1 = __importDefault(require("./routes/upload"));
dotenv.config();
exports.server = (0, fastify_1.default)({ logger: true });
// ─── Plugins ───────────────────────────────────────────────────
exports.server.register(cors_1.default, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
});
exports.server.register(cookie_1.default, {
    secret: process.env.COOKIE_SECRET || 'base2media_cookie_secret',
});
exports.server.register(multipart_1.default);
exports.server.register(static_1.default, {
    root: path_1.default.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
});
// Rate limiting
exports.server.register(rate_limit_1.default, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
        error: 'Too many requests — please slow down.',
        statusCode: 429,
    }),
});
exports.server.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'super_secret_base2media_key',
});
exports.server.register(auditLog_1.default);
// ─── Authentication Decorator ──────────────────────────────────
exports.server.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
// ─── Routes ────────────────────────────────────────────────────
exports.server.register(auth_1.default, { prefix: '/api/auth' });
exports.server.register(admin_1.default, { prefix: '/api/admin' });
exports.server.register(grades_1.default, { prefix: '/api' });
exports.server.register(attendance_1.default, { prefix: '/api' });
exports.server.register(staff_1.default, { prefix: '/api/admin' });
exports.server.register(financials_1.default, { prefix: '/api' });
exports.server.register(csv_1.default, { prefix: '/api' });
exports.server.register(upload_1.default, { prefix: '/api' });
// ─── Health Check ──────────────────────────────────────────────
exports.server.get('/health', async () => ({ status: 'ok', time: new Date() }));
// ─── Start ─────────────────────────────────────────────────────
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3001;
        await exports.server.listen({ port, host: '0.0.0.0' });
        console.log(`\n🚀 Base 2 Media Academy API running on http://localhost:${port}`);
        console.log(`📦 Routes registered: /api/auth, /api/admin, /api/grades, /api/attendance`);
    }
    catch (err) {
        exports.server.log.error(err);
        process.exit(1);
    }
};
start();
