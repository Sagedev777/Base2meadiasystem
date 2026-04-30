import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { auditLogs, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function auditRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── GET all audit logs (admin only) ─────────────────────
  server.get('/audit', guard, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const logs = await db
        .select({
          id:        auditLogs.id,
          action:    auditLogs.action,
          module:    auditLogs.module,
          details:   auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
          userId:    auditLogs.userId,
          userName:  users.name,
          userRole:  users.role,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(200);

      return reply.send({ data: logs });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch audit logs' });
    }
  });
}
