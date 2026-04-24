import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import * as dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import gradesRoutes from './routes/grades';
import attendanceRoutes from './routes/attendance';
import staffRoutes from './routes/staff';
import financialsRoutes from './routes/financials';
import auditPlugin from './plugins/auditLog';
import csvRoutes from './routes/csv';
import uploadRoutes from './routes/upload';

dotenv.config();

export const server = Fastify({ logger: true });

// ─── Plugins ───────────────────────────────────────────────────
server.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
});

server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'base2media_cookie_secret',
});

server.register(multipart);

server.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

// Rate limiting
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Too many requests — please slow down.',
    statusCode: 429,
  }),
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'super_secret_base2media_key',
});

server.register(auditPlugin);

// ─── Authentication Decorator ──────────────────────────────────
server.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// ─── Routes ────────────────────────────────────────────────────
server.register(authRoutes,       { prefix: '/api/auth' });
server.register(adminRoutes,      { prefix: '/api/admin' });
server.register(gradesRoutes,     { prefix: '/api' });
server.register(attendanceRoutes, { prefix: '/api' });
server.register(staffRoutes,      { prefix: '/api/admin' });
server.register(financialsRoutes, { prefix: '/api' });
server.register(csvRoutes,        { prefix: '/api' });
server.register(uploadRoutes,     { prefix: '/api' });

// ─── Health Check ──────────────────────────────────────────────
server.get('/health', async () => ({ status: 'ok', time: new Date() }));

// ─── Start ─────────────────────────────────────────────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 Base 2 Media Academy API running on http://localhost:${port}`);
    console.log(`📦 Routes registered: /api/auth, /api/admin, /api/grades, /api/attendance`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
