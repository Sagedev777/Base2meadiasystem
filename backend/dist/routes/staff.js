"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = staffRoutes;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const createStaffSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).default('staff123'),
    department: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    hireDate: zod_1.z.string().optional(),
});
async function staffRoutes(server) {
    const guard = { onRequest: [server.authenticate] };
    // ─── GET all staff ────────────────────────────────────────
    server.get('/staff', guard, async (_req, reply) => {
        try {
            const result = await db_1.db.select().from(schema_1.staffProfiles);
            return reply.send({ data: result });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch staff' });
        }
    });
    // ─── CREATE staff ─────────────────────────────────────────
    server.post('/staff', guard, async (req, reply) => {
        try {
            const body = createStaffSchema.parse(req.body);
            const passwordHash = await bcrypt_1.default.hash(body.password, 10);
            const userId = (0, uuid_1.v4)();
            await db_1.db.insert(schema_1.users).values({
                id: userId, email: body.email, passwordHash,
                role: 'staff', name: `${body.firstName} ${body.lastName}`, isActive: true,
            });
            const existing = await db_1.db.select().from(schema_1.staffProfiles);
            const staffId = `B2MA-STAFF-${String(existing.length + 1).padStart(3, '0')}`;
            await db_1.db.insert(schema_1.staffProfiles).values({
                userId, staffId,
                firstName: body.firstName, lastName: body.lastName,
                department: body.department ?? null,
                phone: body.phone ?? null,
                hireDate: body.hireDate ?? new Date().toISOString().slice(0, 10),
            });
            return reply.code(201).send({ message: 'Staff account created', staffId });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError)
                return reply.code(400).send({ error: err.errors });
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to create staff' });
        }
    });
    // ─── DEACTIVATE staff ─────────────────────────────────────
    server.patch('/staff/:id/deactivate', guard, async (req, reply) => {
        try {
            const { id } = req.params;
            const staff = await db_1.db.select().from(schema_1.staffProfiles).where((0, drizzle_orm_1.eq)(schema_1.staffProfiles.id, id)).limit(1);
            if (!staff.length)
                return reply.code(404).send({ error: 'Staff not found' });
            await db_1.db.update(schema_1.users)
                .set({ isActive: false })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, staff[0].userId));
            return reply.send({ message: 'Staff account deactivated' });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to deactivate staff' });
        }
    });
    // ─── REACTIVATE staff ─────────────────────────────────────
    server.patch('/staff/:id/reactivate', guard, async (req, reply) => {
        try {
            const { id } = req.params;
            const staff = await db_1.db.select().from(schema_1.staffProfiles).where((0, drizzle_orm_1.eq)(schema_1.staffProfiles.id, id)).limit(1);
            if (!staff.length)
                return reply.code(404).send({ error: 'Staff not found' });
            await db_1.db.update(schema_1.users)
                .set({ isActive: true })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, staff[0].userId));
            return reply.send({ message: 'Staff account reactivated' });
        }
        catch (err) {
            server.log.error(err);
            return reply.code(500).send({ error: 'Failed to reactivate staff' });
        }
    });
}
