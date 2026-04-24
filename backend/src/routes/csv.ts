import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { studentProfiles, grades as gradesTable, classSubjects, subjects } from '../db/schema';
import { eq } from 'drizzle-orm';

const csvGradeRowSchema = z.object({
  studentId: z.string(),
  score:     z.number().min(0).max(100),
});

const csvImportSchema = z.object({
  classSubjectId: z.string().uuid(),
  rows:           z.array(csvGradeRowSchema).min(1).max(200),
});

export default async function csvRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── POST /api/csv/grades  ─────────────────────────────────
  // Accepts parsed rows from the frontend CSV tab and bulk-upserts them
  server.post('/csv/grades', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = csvImportSchema.parse(req.body);
      const user = (req as any).user as { id: string };

      const results = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

      for (const row of body.rows) {
        // Find student by studentId string
        const [student] = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.studentId, row.studentId))
          .limit(1);

        if (!student) {
          results.errors.push(`Student ID not found: ${row.studentId}`);
          results.skipped++;
          continue;
        }

        // Check for existing grade for this student + classSubject
        const [existing] = await db
          .select()
          .from(gradesTable)
          .where(
            eq(gradesTable.studentId, student.id)
          )
          .limit(1);

        if (existing) {
          await db
            .update(gradesTable)
            .set({ score: String(row.score), updatedAt: new Date() })
            .where(eq(gradesTable.id, existing.id));
          results.updated++;
        } else {
          await db.insert(gradesTable).values({
            studentId:      student.id,
            classSubjectId: body.classSubjectId,
            score:          String(row.score),
            recordedBy:     user.id,
            recordedAt:     new Date(),
          });
          results.inserted++;
        }
      }

      return reply.send({
        message: `Processed ${body.rows.length} rows`,
        results,
      });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'CSV import failed' });
    }
  });
}
