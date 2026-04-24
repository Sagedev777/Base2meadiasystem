"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = gradesRoutes;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
/** Auto-calculate letter grade from score */
function calcGrade(score) {
    if (score >= 90)
        return { letterGrade: 'A+', gradePoints: 4.0, descriptiveWord: 'Outstanding' };
    if (score >= 80)
        return { letterGrade: 'A', gradePoints: 3.7, descriptiveWord: 'Excellent' };
    if (score >= 70)
        return { letterGrade: 'B', gradePoints: 3.0, descriptiveWord: 'Good' };
    if (score >= 60)
        return { letterGrade: 'C', gradePoints: 2.0, descriptiveWord: 'Average' };
    if (score >= 50)
        return { letterGrade: 'D', gradePoints: 1.0, descriptiveWord: 'Poor' };
    if (score >= 30)
        return { letterGrade: 'F', gradePoints: 0.0, descriptiveWord: 'Failed' };
    return { letterGrade: 'F-', gradePoints: 0.0, descriptiveWord: 'Worst' };
}
const upsertGradeSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid(),
    classSubjectId: zod_1.z.string().uuid(),
    score: zod_1.z.number().min(0).max(100),
    remarks: zod_1.z.string().optional(),
});
async function gradesRoutes(server) {
    const guard = { onRequest: [server.authenticate] };
    // ─── GET grades for a class/subject/term ─────────────────────
    server.get('/grades', guard, async (req, reply) => {
        try {
            const { classSubjectId } = req.query;
            const query = db_1.db.select().from(schema_1.grades);
            const results = classSubjectId
                ? await db_1.db.select().from(schema_1.grades).where((0, drizzle_orm_1.eq)(schema_1.grades.classSubjectId, classSubjectId))
                : await db_1.db.select().from(schema_1.grades);
            return reply.send({ data: results });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch grades' });
        }
    });
    // ─── UPSERT a grade ───────────────────────────────────────────
    server.post('/grades', guard, async (req, reply) => {
        try {
            const body = upsertGradeSchema.parse(req.body);
            const user = req.user;
            // Check if grade already exists
            const existing = await db_1.db.select().from(schema_1.grades).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.grades.studentId, body.studentId), (0, drizzle_orm_1.eq)(schema_1.grades.classSubjectId, body.classSubjectId))).limit(1);
            if (existing.length > 0) {
                // Update
                await db_1.db.update(schema_1.grades)
                    .set({ score: body.score.toString(), remarks: body.remarks })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.grades.studentId, body.studentId), (0, drizzle_orm_1.eq)(schema_1.grades.classSubjectId, body.classSubjectId)));
                return reply.send({ message: 'Grade updated', ...calcGrade(body.score) });
            }
            else {
                // Insert
                await db_1.db.insert(schema_1.grades).values({
                    studentId: body.studentId,
                    classSubjectId: body.classSubjectId,
                    score: body.score.toString(),
                    remarks: body.remarks,
                    recordedBy: user.id,
                });
                return reply.code(201).send({ message: 'Grade recorded', ...calcGrade(body.score) });
            }
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to save grade' });
        }
    });
    // ─── GET student GPA summary ──────────────────────────────────
    server.get('/grades/summary/:studentId', guard, async (req, reply) => {
        try {
            const { studentId } = req.params;
            const studentGrades = await db_1.db.select().from(schema_1.grades).where((0, drizzle_orm_1.eq)(schema_1.grades.studentId, studentId));
            if (!studentGrades.length)
                return reply.send({ gpa: 0, subjects: 0, grades: [] });
            const enriched = studentGrades.map(g => {
                const score = parseFloat(g.score);
                return { ...g, score, ...calcGrade(score) };
            });
            const gpa = parseFloat((enriched.reduce((s, g) => s + g.gradePoints, 0) / enriched.length).toFixed(2));
            return reply.send({ gpa, subjects: enriched.length, grades: enriched });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch summary' });
        }
    });
}
