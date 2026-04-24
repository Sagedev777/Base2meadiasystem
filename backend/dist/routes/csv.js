"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = csvRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const csvGradeRowSchema = zod_1.z.object({
    studentId: zod_1.z.string(),
    score: zod_1.z.number().min(0).max(100),
});
const csvImportSchema = zod_1.z.object({
    classSubjectId: zod_1.z.string().uuid(),
    rows: zod_1.z.array(csvGradeRowSchema).min(1).max(200),
});
async function csvRoutes(server) {
    const guard = { onRequest: [server.authenticate] };
    // ─── POST /api/csv/grades  ─────────────────────────────────
    // Accepts parsed rows from the frontend CSV tab and bulk-upserts them
    server.post('/csv/grades', guard, async (req, reply) => {
        try {
            const body = csvImportSchema.parse(req.body);
            const user = req.user;
            const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };
            for (const row of body.rows) {
                // Find student by studentId string
                const [student] = await db_1.db
                    .select()
                    .from(schema_1.studentProfiles)
                    .where((0, drizzle_orm_1.eq)(schema_1.studentProfiles.studentId, row.studentId))
                    .limit(1);
                if (!student) {
                    results.errors.push(`Student ID not found: ${row.studentId}`);
                    results.skipped++;
                    continue;
                }
                // Check for existing grade for this student + classSubject
                const [existing] = await db_1.db
                    .select()
                    .from(schema_1.grades)
                    .where((0, drizzle_orm_1.eq)(schema_1.grades.studentId, student.id))
                    .limit(1);
                if (existing) {
                    await db_1.db
                        .update(schema_1.grades)
                        .set({ score: String(row.score), updatedAt: new Date() })
                        .where((0, drizzle_orm_1.eq)(schema_1.grades.id, existing.id));
                    results.updated++;
                }
                else {
                    await db_1.db.insert(schema_1.grades).values({
                        studentId: student.id,
                        classSubjectId: body.classSubjectId,
                        score: String(row.score),
                        recordedBy: user.id,
                        recordedAt: new Date(),
                    });
                    results.inserted++;
                }
            }
            return reply.send({
                message: `Processed ${body.rows.length} rows`,
                results,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'CSV import failed' });
        }
    });
}
