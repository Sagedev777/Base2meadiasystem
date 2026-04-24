"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminRoutes;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const createStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).default('student123'),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    classId: zod_1.z.string().uuid().optional(),
    enrollmentDate: zod_1.z.string().optional(),
});
async function adminRoutes(server) {
    // Middleware: Admin only
    const adminGuard = { onRequest: [server.authenticate] };
    // ─── GET all students ───────────────────────────────────────────
    server.get('/students', adminGuard, async (req, reply) => {
        try {
            const students = await db_1.db.select().from(schema_1.studentProfiles);
            return reply.send({ data: students });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch students' });
        }
    });
    // ─── CREATE student ─────────────────────────────────────────────
    server.post('/students', adminGuard, async (req, reply) => {
        try {
            const body = createStudentSchema.parse(req.body);
            const passwordHash = await bcrypt_1.default.hash(body.password, 10);
            // Create user account
            const userId = (0, uuid_1.v4)();
            await db_1.db.insert(schema_1.users).values({
                id: userId,
                email: body.email,
                passwordHash,
                role: 'student',
                name: `${body.firstName} ${body.lastName}`,
                isActive: true,
            });
            // Count existing students for ID generation
            const existing = await db_1.db.select().from(schema_1.studentProfiles);
            const studentId = `B2MA-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, '0')}`;
            // Create student profile
            await db_1.db.insert(schema_1.studentProfiles).values({
                userId,
                studentId,
                firstName: body.firstName,
                lastName: body.lastName,
                dateOfBirth: body.dateOfBirth ?? null,
                gender: body.gender ?? null,
                phone: body.phone ?? null,
                address: body.address ?? null,
                classId: body.classId ?? null,
                enrollmentDate: body.enrollmentDate ?? new Date().toISOString().slice(0, 10),
                status: 'active',
            });
            return reply.code(201).send({ message: 'Student enrolled successfully', studentId });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to create student' });
        }
    });
    // ─── GET all classes ────────────────────────────────────────────
    server.get('/classes', adminGuard, async (_req, reply) => {
        try {
            const allClasses = await db_1.db.select().from(schema_1.classes);
            return reply.send({ data: allClasses });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch classes' });
        }
    });
    // ─── CREATE class ───────────────────────────────────────────────
    server.post('/classes', adminGuard, async (req, reply) => {
        try {
            const { name, termId, capacity } = zod_1.z.object({
                name: zod_1.z.string().min(1),
                termId: zod_1.z.string().uuid(),
                capacity: zod_1.z.number().default(40),
            }).parse(req.body);
            await db_1.db.insert(schema_1.classes).values({ name, termId, capacity });
            return reply.code(201).send({ message: 'Class created successfully' });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to create class' });
        }
    });
}
