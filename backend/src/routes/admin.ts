import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { studentProfiles, users, classes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).default('student123'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().uuid().optional(),
  enrollmentDate: z.string().optional(),
});

export default async function adminRoutes(server: FastifyInstance) {
  // Middleware: Admin only
  const adminGuard = { onRequest: [server.authenticate] };

  // ─── GET system data ───────────────────────────────────────────
  server.get('/system-data', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const allStudents = await db.select({
        id: studentProfiles.id,
        studentId: studentProfiles.studentId,
        firstName: studentProfiles.firstName,
        lastName: studentProfiles.lastName,
        fullName: users.name,
        dateOfBirth: studentProfiles.dateOfBirth,
        gender: studentProfiles.gender,
        classId: studentProfiles.classId,
        enrollmentDate: studentProfiles.enrollmentDate,
        status: studentProfiles.status,
        email: users.email,
        phone: studentProfiles.phone,
        address: studentProfiles.address,
      }).from(studentProfiles).innerJoin(users, eq(studentProfiles.userId, users.id));

      const allStaff = await db.select({
        id: staffProfiles.id,
        staffId: staffProfiles.staffId,
        firstName: staffProfiles.firstName,
        lastName: staffProfiles.lastName,
        fullName: users.name,
        email: users.email,
        department: staffProfiles.department,
        phone: staffProfiles.phone,
        hireDate: staffProfiles.hireDate,
      }).from(staffProfiles).innerJoin(users, eq(staffProfiles.userId, users.id));

      const allClasses = await db.select().from(classes);

      return reply.send({
        students: allStudents,
        staff: allStaff,
        classes: allClasses,
      });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch system data' });
    }
  });

  // ─── GET all students ───────────────────────────────────────────
  server.get('/students', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const students = await db.select().from(studentProfiles);
      return reply.send({ data: students });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch students' });
    }
  });

  // ─── CREATE student ─────────────────────────────────────────────
  server.post('/students', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createStudentSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(body.password, 10);

      // Create user account
      const userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        email: body.email,
        passwordHash,
        role: 'student',
        name: `${body.firstName} ${body.lastName}`,
        isActive: true,
      });

      // Count existing students for ID generation
      const existing = await db.select().from(studentProfiles);
      const studentId = `B2MA-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, '0')}`;

      // Create student profile
      await db.insert(studentProfiles).values({
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
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to create student' });
    }
  });

  // ─── GET all classes ────────────────────────────────────────────
  server.get('/classes', adminGuard, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const allClasses = await db.select().from(classes);
      return reply.send({ data: allClasses });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch classes' });
    }
  });

  // ─── CREATE class ───────────────────────────────────────────────
  server.post('/classes', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, termId, capacity } = z.object({
        name: z.string().min(1),
        termId: z.string().uuid(),
        capacity: z.number().default(40),
      }).parse(req.body);

      await db.insert(classes).values({ name, termId, capacity });
      return reply.code(201).send({ message: 'Class created successfully' });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to create class' });
    }
  });
}
