import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { users, refreshTokens } from '../db/schema';
import { eq, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;

function makeRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

export default async function authRoutes(server: FastifyInstance) {

  // ─── POST /api/auth/login ─────────────────────────────────
  server.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
      if (!user.isActive) return reply.code(403).send({ error: 'Account is deactivated' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });

      // Access token (15 min)
      const accessToken = server.jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      // Refresh token (7 days) — stored in DB
      const rawToken = makeRefreshToken();
      const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

      await db.insert(refreshTokens).values({
        id: uuidv4(), userId: user.id, token: rawToken, expiresAt,
      });

      // Set refresh token as HTTP-only cookie
      reply.setCookie('refresh_token', rawToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path:     '/api/auth',
        maxAge:   REFRESH_DAYS * 24 * 60 * 60,
      });

      return reply.send({
        accessToken,
        user: { id: user.id, email: user.email, role: user.role, name: user.name },
      });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // ─── POST /api/auth/refresh ───────────────────────────────
  server.post('/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawToken = (req.cookies as any)?.refresh_token;
      if (!rawToken) return reply.code(401).send({ error: 'No refresh token' });

      const [stored] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, rawToken))
        .limit(1);

      if (!stored) return reply.code(401).send({ error: 'Invalid refresh token' });
      if (new Date() > stored.expiresAt!) return reply.code(401).send({ error: 'Refresh token expired' });

      const [user] = await db.select().from(users).where(eq(users.id, stored.userId)).limit(1);
      if (!user || !user.isActive) return reply.code(403).send({ error: 'Account not active' });

      // Rotate token — delete old, issue new
      await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

      const newRaw = makeRefreshToken();
      const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
      await db.insert(refreshTokens).values({ id: uuidv4(), userId: user.id, token: newRaw, expiresAt });

      reply.setCookie('refresh_token', newRaw, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path:     '/api/auth',
        maxAge:   REFRESH_DAYS * 24 * 60 * 60,
      });

      const accessToken = server.jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      return reply.send({ accessToken });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  });

  // ─── POST /api/auth/logout ────────────────────────────────
  server.post('/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rawToken = (req.cookies as any)?.refresh_token;
      if (rawToken) {
        await db.delete(refreshTokens).where(eq(refreshTokens.token, rawToken));
      }
      reply.clearCookie('refresh_token', { path: '/api/auth' });
      return reply.send({ message: 'Logged out' });
    } catch {
      return reply.send({ message: 'Logged out' });
    }
  });

  // ─── POST /api/auth/forgot-password ──────────────────────
  server.post('/forgot-password', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      // Always respond 200 to prevent email enumeration
      if (!user) return reply.send({ message: 'If that email exists, a reset link was sent.' });

      // Generate a short-lived reset token (30 min)
      const resetToken = server.jwt.sign(
        { id: user.id, purpose: 'password-reset' },
        { expiresIn: '30m' }
      );

      const resetLink = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      // Import email service and send
      try {
        const { sendPasswordReset } = await import('../services/emailService');
        await sendPasswordReset({ email: user.email, name: user.name, resetLink });
      } catch (emailErr) {
        server.log.warn(emailErr, 'Email send failed (check SMTP config):');
      }

      return reply.send({ message: 'If that email exists, a reset link was sent.' });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Request failed' });
    }
  });
}
