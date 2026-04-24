import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { grades, studentProfiles, classSubjects, subjects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/** Auto-calculate letter grade from score */
function calcGrade(score: number) {
  if (score >= 90) return { letterGrade: 'A+', gradePoints: 4.0, descriptiveWord: 'Outstanding' };
  if (score >= 80) return { letterGrade: 'A',  gradePoints: 3.7, descriptiveWord: 'Excellent' };
  if (score >= 70) return { letterGrade: 'B',  gradePoints: 3.0, descriptiveWord: 'Good' };
  if (score >= 60) return { letterGrade: 'C',  gradePoints: 2.0, descriptiveWord: 'Average' };
  if (score >= 50) return { letterGrade: 'D',  gradePoints: 1.0, descriptiveWord: 'Poor' };
  if (score >= 30) return { letterGrade: 'F',  gradePoints: 0.0, descriptiveWord: 'Failed' };
  return { letterGrade: 'F-', gradePoints: 0.0, descriptiveWord: 'Worst' };
}

const upsertGradeSchema = z.object({
  studentId: z.string().uuid(),
  classSubjectId: z.string().uuid(),
  score: z.number().min(0).max(100),
  remarks: z.string().optional(),
});

export default async function gradesRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── GET grades for a class/subject/term ─────────────────────
  server.get('/grades', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { classSubjectId } = req.query as { classSubjectId?: string };
      const query = db.select().from(grades);
      const results = classSubjectId
        ? await db.select().from(grades).where(eq(grades.classSubjectId, classSubjectId))
        : await db.select().from(grades);
      return reply.send({ data: results });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch grades' });
    }
  });

  // ─── UPSERT a grade ───────────────────────────────────────────
  server.post('/grades', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = upsertGradeSchema.parse(req.body);
      const user = (req as any).user;

      // Check if grade already exists
      const existing = await db.select().from(grades).where(
        and(eq(grades.studentId, body.studentId), eq(grades.classSubjectId, body.classSubjectId))
      ).limit(1);

      if (existing.length > 0) {
        // Update
        await db.update(grades)
          .set({ score: body.score.toString(), remarks: body.remarks })
          .where(and(eq(grades.studentId, body.studentId), eq(grades.classSubjectId, body.classSubjectId)));
        return reply.send({ message: 'Grade updated', ...calcGrade(body.score) });
      } else {
        // Insert
        await db.insert(grades).values({
          studentId: body.studentId,
          classSubjectId: body.classSubjectId,
          score: body.score.toString(),
          remarks: body.remarks,
          recordedBy: user.id,
        });
        return reply.code(201).send({ message: 'Grade recorded', ...calcGrade(body.score) });
      }
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to save grade' });
    }
  });

  // ─── GET student GPA summary ──────────────────────────────────
  server.get('/grades/summary/:studentId', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = req.params as { studentId: string };
      const studentGrades = await db.select().from(grades).where(eq(grades.studentId, studentId));
      
      if (!studentGrades.length) return reply.send({ gpa: 0, subjects: 0, grades: [] });
      
      const enriched = studentGrades.map(g => {
        const score = parseFloat(g.score as unknown as string);
        return { ...g, score, ...calcGrade(score) };
      });

      const gpa = parseFloat(
        (enriched.reduce((s, g) => s + g.gradePoints, 0) / enriched.length).toFixed(2)
      );

      return reply.send({ gpa, subjects: enriched.length, grades: enriched });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch summary' });
    }
  });
}
