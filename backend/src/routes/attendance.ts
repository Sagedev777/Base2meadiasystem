import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { attendance } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const attendanceStatusEnum = z.enum(['present', 'absent', 'late', 'excused']);

const batchAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: attendanceStatusEnum,
    notes: z.string().optional(),
  })),
});

export default async function attendanceRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── GET attendance for a class + date ───────────────────────
  server.get('/attendance', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { classId, date } = req.query as { classId?: string; date?: string };
      let results;
      if (classId && date) {
        results = await db.select().from(attendance)
          .where(and(eq(attendance.classId, classId), eq(attendance.date, date)));
      } else if (classId) {
        results = await db.select().from(attendance).where(eq(attendance.classId, classId));
      } else {
        results = await db.select().from(attendance);
      }
      return reply.send({ data: results });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch attendance' });
    }
  });

  // ─── BATCH submit attendance for a class ─────────────────────
  server.post('/attendance/batch', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = batchAttendanceSchema.parse(req.body);
      const user = (req as any).user;

      let inserted = 0;
      let updated = 0;

      for (const record of body.records) {
        const existing = await db.select().from(attendance)
          .where(and(
            eq(attendance.studentId, record.studentId),
            eq(attendance.classId, body.classId),
            eq(attendance.date, body.date)
          )).limit(1);

        if (existing.length > 0) {
          await db.update(attendance)
            .set({ status: record.status, notes: record.notes })
            .where(and(
              eq(attendance.studentId, record.studentId),
              eq(attendance.classId, body.classId),
              eq(attendance.date, body.date)
            ));
          updated++;
        } else {
          await db.insert(attendance).values({
            studentId: record.studentId,
            classId: body.classId,
            date: body.date,
            status: record.status,
            notes: record.notes,
            checkedBy: user.id,
          });
          inserted++;
        }
      }

      return reply.send({
        message: `Attendance submitted: ${inserted} new, ${updated} updated`,
        inserted,
        updated,
      });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to submit attendance' });
    }
  });

  // ─── GET student attendance summary ──────────────────────────
  server.get('/attendance/summary/:studentId', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = req.params as { studentId: string };
      const records = await db.select().from(attendance).where(eq(attendance.studentId, studentId));

      const summary = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };
      records.forEach(r => { summary[r.status]++; });

      const percentage = summary.total
        ? Math.round(((summary.present + summary.late) / summary.total) * 100)
        : 0;

      return reply.send({ ...summary, percentage, records });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch summary' });
    }
  });
}
