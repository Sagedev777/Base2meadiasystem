import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { auditLogs } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

interface AuditPayload {
  userId:  string;
  action:  string;
  module:  string;
  details: string;
  ip:      string;
}

/** Write one audit entry to the DB */
export async function writeAuditLog(payload: AuditPayload) {
  try {
    await db.insert(auditLogs).values({
      id:        uuidv4(),
      userId:    payload.userId,
      action:    payload.action,
      module:    payload.module,
      details:   payload.details,
      ipAddress: payload.ip,
      createdAt: new Date(),
    });
  } catch (err) {
    // Non-fatal: log to console but never crash a route
    console.error('[AuditLog] Failed to write:', err);
  }
}

/** Fastify plugin — registers an onSend hook that auto-logs all non-GET mutations */
export default async function auditPlugin(server: FastifyInstance) {
  server.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
    if (!req.url.startsWith('/api')) return;

    const user   = (req as any).user as { id: string; role: string } | undefined;
    if (!user) return;

    const action = method === 'POST'   ? 'CREATE'
                 : method === 'PUT'    ? 'UPDATE'
                 : method === 'PATCH'  ? 'PATCH'
                 : method === 'DELETE' ? 'DELETE'
                 : method;

    const module = req.url.split('/')[2]?.toUpperCase() ?? 'UNKNOWN';

    await writeAuditLog({
      userId:  user.id,
      action,
      module,
      details: `${method} ${req.url} → ${reply.statusCode}`,
      ip:      req.ip,
    });
  });
}
