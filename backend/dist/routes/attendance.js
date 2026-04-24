"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = attendanceRoutes;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const zod_1 = require("zod");
const attendanceStatusEnum = zod_1.z.enum(['present', 'absent', 'late', 'excused']);
const batchAttendanceSchema = zod_1.z.object({
    classId: zod_1.z.string().uuid(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    records: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().uuid(),
        status: attendanceStatusEnum,
        notes: zod_1.z.string().optional(),
    })),
});
async function attendanceRoutes(server) {
    const guard = { onRequest: [server.authenticate] };
    // ─── GET attendance for a class + date ───────────────────────
    server.get('/attendance', guard, async (req, reply) => {
        try {
            const { classId, date } = req.query;
            let results;
            if (classId && date) {
                results = await db_1.db.select().from(schema_1.attendance)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.classId, classId), (0, drizzle_orm_1.eq)(schema_1.attendance.date, date)));
            }
            else if (classId) {
                results = await db_1.db.select().from(schema_1.attendance).where((0, drizzle_orm_1.eq)(schema_1.attendance.classId, classId));
            }
            else {
                results = await db_1.db.select().from(schema_1.attendance);
            }
            return reply.send({ data: results });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch attendance' });
        }
    });
    // ─── BATCH submit attendance for a class ─────────────────────
    server.post('/attendance/batch', guard, async (req, reply) => {
        try {
            const body = batchAttendanceSchema.parse(req.body);
            const user = req.user;
            let inserted = 0;
            let updated = 0;
            for (const record of body.records) {
                const existing = await db_1.db.select().from(schema_1.attendance)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, record.studentId), (0, drizzle_orm_1.eq)(schema_1.attendance.classId, body.classId), (0, drizzle_orm_1.eq)(schema_1.attendance.date, body.date))).limit(1);
                if (existing.length > 0) {
                    await db_1.db.update(schema_1.attendance)
                        .set({ status: record.status, notes: record.notes })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, record.studentId), (0, drizzle_orm_1.eq)(schema_1.attendance.classId, body.classId), (0, drizzle_orm_1.eq)(schema_1.attendance.date, body.date)));
                    updated++;
                }
                else {
                    await db_1.db.insert(schema_1.attendance).values({
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
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to submit attendance' });
        }
    });
    // ─── GET student attendance summary ──────────────────────────
    server.get('/attendance/summary/:studentId', guard, async (req, reply) => {
        try {
            const { studentId } = req.params;
            const records = await db_1.db.select().from(schema_1.attendance).where((0, drizzle_orm_1.eq)(schema_1.attendance.studentId, studentId));
            const summary = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };
            records.forEach(r => { summary[r.status]++; });
            const percentage = summary.total
                ? Math.round(((summary.present + summary.late) / summary.total) * 100)
                : 0;
            return reply.send({ ...summary, percentage, records });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch summary' });
        }
    });
}
