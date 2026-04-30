import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { studentProfiles, staffProfiles, users, classes, terms, grades, payments, parentProfiles, classSubjects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).default('student123'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().optional().nullable(),
  className: z.string().optional(),
  enrollmentDate: z.string().optional(),
  photoUrl: z.string().optional(),
  parentName1: z.string().optional(),
  parentPhone1: z.string().optional(),
  parentName2: z.string().optional(),
  parentPhone2: z.string().optional(),
  enrolledCourseIds: z.array(z.string()).optional(),
  totalFee: z.number().optional(),
  initialPayment: z.number().optional(),
});

export default async function adminRoutes(server: FastifyInstance) {
  // Middleware: Admin only
  const adminGuard = { onRequest: [server.authenticate] };

  // ─── GET system data ───────────────────────────────────────────
  server.get('/system-data', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const allStudents = await db.select({
        id:             studentProfiles.id,
        studentId:      studentProfiles.studentId,
        firstName:      studentProfiles.firstName,
        lastName:       studentProfiles.lastName,
        fullName:       users.name,
        dateOfBirth:    studentProfiles.dateOfBirth,
        gender:         studentProfiles.gender,
        className:      studentProfiles.className,
        classId:        studentProfiles.classId,
        enrollmentDate: studentProfiles.enrollmentDate,
        status:         studentProfiles.status,
        email:          users.email,
        phone:          studentProfiles.phone,
        address:        studentProfiles.address,
        photoUrl:       studentProfiles.photoUrl,
        parentName1:    studentProfiles.parentName1,
        parentPhone1:   studentProfiles.parentPhone1,
        parentName2:    studentProfiles.parentName2,
        parentPhone2:   studentProfiles.parentPhone2,
        enrolledCourseIds: studentProfiles.enrolledCourseIds,
        totalFee:       studentProfiles.totalFee,
      }).from(studentProfiles).innerJoin(users, eq(studentProfiles.userId, users.id));

      const allStaff = await db.select({
        id:         staffProfiles.id,
        staffId:    staffProfiles.staffId,
        firstName:  staffProfiles.firstName,
        lastName:   staffProfiles.lastName,
        fullName:   users.name,
        email:      users.email,
        department: staffProfiles.department,
        phone:      staffProfiles.phone,
        hireDate:   staffProfiles.hireDate,
        photoUrl:   staffProfiles.photoUrl,
      }).from(staffProfiles).innerJoin(users, eq(staffProfiles.userId, users.id));

      const allClasses = await db.select().from(classes);
      const allTerms   = await db.select().from(terms);
      const allGrades  = await db.select().from(grades);

      return reply.send({
        students:   allStudents,
        staff:      allStaff,
        classes:    allClasses,
        terms:      allTerms,
        grades:     allGrades,
        payments:   [],   // payments table to be added in future
        attendance: [],
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
      
      // Check if email already exists
      if (body.email) {
        const [existingUser] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
        if (existingUser) {
          return reply.code(400).send({ error: `The email "${body.email}" is already registered to another user.` });
        }
      }

      const passwordHash = await bcrypt.hash(body.password, 10);

      // Create user account
      const userId = uuidv4();
      const finalEmail = body.email || `student_${Date.now()}@base2media.ac`;
      
      try {
        await db.insert(users).values({
          id: userId,
          email: finalEmail,
          passwordHash,
          role: 'student',
          name: `${body.firstName} ${body.lastName}`,
          isActive: true,
        });
      } catch (dbErr: any) {
        if (dbErr.code === 'ER_DUP_ENTRY') {
          return reply.code(400).send({ error: 'A user with this email already exists.' });
        }
        throw dbErr;
      }

      // Count existing students for ID generation
      const existing = await db.select().from(studentProfiles);
      const studentId = `B2MA-${new Date().getFullYear()}-${String(existing.length + 1).padStart(3, '0')}`;

      // Create student profile
      const profileId = uuidv4();
      await db.insert(studentProfiles).values({
        id: profileId,
        userId,
        studentId,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth && body.dateOfBirth.trim() !== '' ? body.dateOfBirth : null,
        gender: body.gender && body.gender.trim() !== '' ? body.gender : null,
        phone: body.phone && body.phone.trim() !== '' ? body.phone : null,
        address: body.address && body.address.trim() !== '' ? body.address : null,
        className: body.className && body.className.trim() !== '' ? body.className : null,
        classId: body.classId && body.classId.trim() !== '' ? body.classId : null,
        enrollmentDate: body.enrollmentDate && body.enrollmentDate.trim() !== '' ? body.enrollmentDate : new Date().toISOString().slice(0, 10),
        status: 'active',
        photoUrl: body.photoUrl && body.photoUrl.trim() !== '' ? body.photoUrl : null,
        parentName1: body.parentName1 ?? null,
        parentPhone1: body.parentPhone1 ?? null,
        parentName2: body.parentName2 ?? null,
        parentPhone2: body.parentPhone2 ?? null,
        enrolledCourseIds: body.enrolledCourseIds ? JSON.stringify(body.enrolledCourseIds) : null,
        totalFee: body.totalFee ? body.totalFee.toString() : null,
      });

      // Mirror to parent profiles for future separate management
      if (body.parentName1) {
        await db.insert(parentProfiles).values({
          id: uuidv4(),
          studentId: profileId,
          firstName: body.parentName1,
          phone: body.parentPhone1,
        });
      }

      return reply.code(201).send({ message: 'Student registered successfully', studentId, id: userId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        server.log.error(err.errors);
        return reply.code(400).send({ error: err.errors });
      }
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to create student profile. Please ensure all fields are valid.' });
    }
  });

  // ─── UPDATE student ─────────────────────────────────────────────
  server.put('/students/:id', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const body = createStudentSchema.partial().parse(req.body);
      console.log('UPDATE STUDENT body:', JSON.stringify(body, null, 2));

      const [existing] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id)).limit(1);
      if (!existing) return reply.code(404).send({ error: 'Student not found' });

      // Update student profile
      await db.update(studentProfiles).set({
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth && body.dateOfBirth.trim() !== '' ? body.dateOfBirth : undefined,
        gender: body.gender,
        phone: body.phone,
        address: body.address,
        className: body.className,
        classId: body.classId,
        enrollmentDate: body.enrollmentDate,
        photoUrl: body.photoUrl,
        parentName1: body.parentName1,
        parentPhone1: body.parentPhone1,
        parentName2: body.parentName2,
        parentPhone2: body.parentPhone2,
        enrolledCourseIds: body.enrolledCourseIds !== undefined ? JSON.stringify(body.enrolledCourseIds) : undefined,
        totalFee: body.totalFee !== undefined ? body.totalFee.toString() : undefined,
      }).where(eq(studentProfiles.id, id));

      // Update user name if names changed
      if (body.firstName || body.lastName) {
        await db.update(users).set({
          name: `${body.firstName ?? existing.firstName} ${body.lastName ?? existing.lastName}`
        }).where(eq(users.id, existing.userId!));
      }

      return reply.send({ message: 'Student updated successfully' });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to update student profile' });
    }
  });

  // ─── DELETE student ─────────────────────────────────────────────
  server.delete('/students/:id', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      // Delete student profile (cascade will handle user account if set up, but let's be explicit)
      const [student] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, id)).limit(1);
      if (!student) return reply.code(404).send({ error: 'Student not found' });

      await db.delete(studentProfiles).where(eq(studentProfiles.id, id));
      await db.delete(users).where(eq(users.id, student.userId!));

      return reply.send({ message: 'Student record deleted successfully' });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete student record' });
    }
  });

  // ─── UPDATE student status (Withdraw/Reactivate) ──────────────────
  server.patch('/students/:id/status', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const { status } = z.object({ status: z.enum(['active', 'inactive', 'graduated', 'withdrawn']) }).parse(req.body);

      await db.update(studentProfiles).set({ status }).where(eq(studentProfiles.id, id));
      return reply.send({ message: `Student status updated to ${status}` });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to update student status' });
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

  // ─── UPDATE staff ──────────────────────────────────────────────
  server.put('/staff/:id', adminGuard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as any;

      await db.update(staffProfiles).set({
        firstName: body.firstName,
        lastName:  body.lastName,
        phone:      body.phone,
        department: body.department,
        photoUrl:   body.photoUrl,
      }).where(eq(staffProfiles.id, id));

      if (body.email) {
        const [sf] = await db.select().from(staffProfiles).where(eq(staffProfiles.id, id)).limit(1);
        if (sf?.userId) {
          await db.update(users).set({
            email: body.email,
            name: `${body.firstName} ${body.lastName}`,
          }).where(eq(users.id, sf.userId));
        }
      }

      return reply.send({ message: 'Staff profile updated' });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to update staff' });
    }
  });

  // ─── SUBJECT ASSIGNMENTS ───────────────────────────────────────
  server.get('/subject-assignments', adminGuard, async (_req, reply) => {
    try {
      const data = await db.select().from(classSubjects);
      return reply.send({ data });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch assignments' });
    }
  });

  server.post('/subject-assignments', adminGuard, async (req, reply) => {
    try {
      const body = req.body as any;
      const id = uuidv4();
      await db.insert(classSubjects).values({
        id,
        staffId:   body.staffId,
        subjectId: body.subjectId,
        classId:   body.classId,
        termId:    body.termId,
      });
      return reply.code(201).send({ id });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to create assignment' });
    }
  });

  server.delete('/subject-assignments/:id', adminGuard, async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      await db.delete(classSubjects).where(eq(classSubjects.id, id));
      return reply.send({ message: 'Assignment removed' });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to remove assignment' });
    }
  });

  // ─── PAYMENTS ──────────────────────────────────────────────────
  server.get('/payments', adminGuard, async (_req, reply) => {
    try {
      const all = await db.select().from(payments);
      return reply.send({ data: all });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch payments' });
    }
  });

  server.post('/payments', adminGuard, async (req, reply) => {
    try {
      const body = req.body as any;
      const id = uuidv4();
      await db.insert(payments).values({
        id,
        studentId:     body.studentId,
        amount:        body.amount.toString(),
        paymentDate:   body.paymentDate || new Date().toISOString().slice(0, 10),
        paymentMethod: body.paymentMethod || 'Cash',
        status:        body.status || 'completed',
        reference:     body.reference,
        notes:         body.notes,
      });
      return reply.code(201).send({ id });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to record payment' });
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
