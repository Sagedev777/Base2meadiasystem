import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { users, staffProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const createStaffSchema = z.object({
  firstName:  z.string().min(1),
  lastName:   z.string().min(1),
  email:      z.string().email(),
  password:   z.string().min(6).default('staff123'),
  department: z.string().optional(),
  phone:      z.string().optional(),
  hireDate:   z.string().optional(),
});

export default async function staffRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── GET all staff ────────────────────────────────────────
  server.get('/staff', guard, async (_req, reply: FastifyReply) => {
    try {
      const result = await db.select().from(staffProfiles);
      return reply.send({ data: result });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch staff' });
    }
  });

  // ─── CREATE staff ─────────────────────────────────────────
  server.post('/staff', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createStaffSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(body.password, 10);
      const userId = uuidv4();

      await db.insert(users).values({
        id: userId, email: body.email, passwordHash,
        role: 'staff', name: `${body.firstName} ${body.lastName}`, isActive: true,
      });

      const existing = await db.select().from(staffProfiles);
      const staffId = `B2MA-STAFF-${String(existing.length + 1).padStart(3, '0')}`;

      await db.insert(staffProfiles).values({
        userId, staffId,
        firstName: body.firstName, lastName: body.lastName,
        department: body.department ?? null,
        phone: body.phone ?? null,
        hireDate: body.hireDate ?? new Date().toISOString().slice(0, 10),
      });

      return reply.code(201).send({ message: 'Staff account created', staffId });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to create staff' });
    }
  });

  // ─── DEACTIVATE staff ─────────────────────────────────────
  server.patch('/staff/:id/deactivate', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const staff = await db.select().from(staffProfiles).where(eq(staffProfiles.id, id)).limit(1);
      if (!staff.length) return reply.code(404).send({ error: 'Staff not found' });

      await db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, staff[0].userId!));

      return reply.send({ message: 'Staff account deactivated' });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to deactivate staff' });
    }
  });

  // ─── REACTIVATE staff ─────────────────────────────────────
  server.patch('/staff/:id/reactivate', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const staff = await db.select().from(staffProfiles).where(eq(staffProfiles.id, id)).limit(1);
      if (!staff.length) return reply.code(404).send({ error: 'Staff not found' });

      await db.update(users)
        .set({ isActive: true })
        .where(eq(users.id, staff[0].userId!));

      return reply.send({ message: 'Staff account reactivated' });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to reactivate staff' });
    }
  });
}
