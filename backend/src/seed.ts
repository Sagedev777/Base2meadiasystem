import { db } from './db';
import { users, terms, classes, studentProfiles, staffProfiles, parentProfiles, subjects } from './db/schema';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function seed() {
  console.log('\n🌱 Seeding Base 2 Media Academy database...\n');

  try {
    // ─── Clear existing data ──────────────────────────────────
    console.log('🧹 Clearing existing data...');
    await db.delete(parentProfiles).execute();
    await db.delete(staffProfiles).execute();
    await db.delete(studentProfiles).execute();
    await db.delete(users).execute();
    await db.delete(classes).execute();
    await db.delete(terms).execute();
    await db.delete(subjects).execute();

    // ─── Academic Term ────────────────────────────────────────
    console.log('📅 Creating term...');
    const termId = uuidv4();
    await db.insert(terms).values({
      id: termId,
      name: 'Term 2 — 2025',
      startDate: '2025-01-06',
      endDate: '2025-04-30',
      isCurrent: true,
    });

    // ─── Classes ──────────────────────────────────────────────
    console.log('🏫 Creating classes...');
    const classIds = { c1: uuidv4(), c2: uuidv4(), c3: uuidv4() };
    await db.insert(classes).values([
      { id: classIds.c1, name: 'Diploma in Media Production 1', termId, capacity: 35 },
      { id: classIds.c2, name: 'Certificate in Photography 2',  termId, capacity: 30 },
      { id: classIds.c3, name: 'HND Media & Communication',     termId, capacity: 40 },
    ]);

    // ─── Subjects ─────────────────────────────────────────────
    console.log('📚 Creating subjects...');
    const subjectIds = {
      s1: uuidv4(), s2: uuidv4(), s3: uuidv4(),
      s4: uuidv4(), s5: uuidv4(),
    };
    await db.insert(subjects).values([
      { id: subjectIds.s1, name: 'Media Production Fundamentals', code: 'MPF101' },
      { id: subjectIds.s2, name: 'Digital Photography',            code: 'DPH102' },
      { id: subjectIds.s3, name: 'Video Editing & Post Production',code: 'VEP201' },
      { id: subjectIds.s4, name: 'Broadcast Journalism',           code: 'BCJ301' },
      { id: subjectIds.s5, name: 'Social Media Marketing',         code: 'SMM401' },
    ]);

    // ─── Admin User ───────────────────────────────────────────
    console.log('👨‍💼 Creating admin user...');
    const adminId = uuidv4();
    await db.insert(users).values({
      id: adminId,
      email: 'admin@base2media.ac',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      name: 'Dr. Samuel Osei',
      isActive: true,
    });

    // ─── Staff User ───────────────────────────────────────────
    console.log('👩‍🏫 Creating staff user...');
    const staffUserId = uuidv4();
    const staffProfileId = uuidv4();
    await db.insert(users).values({
      id: staffUserId,
      email: 'staff@base2media.ac',
      passwordHash: await bcrypt.hash('staff123', 10),
      role: 'staff',
      name: 'Mrs. Abena Mensah',
      isActive: true,
    });
    await db.insert(staffProfiles).values({
      id: staffProfileId,
      userId: staffUserId,
      staffId: 'B2MA-STAFF-001',
      firstName: 'Abena',
      lastName: 'Mensah',
      department: 'Media Production',
      phone: '+233 24 111 2222',
      hireDate: '2022-09-01',
    });

    // ─── Student User ─────────────────────────────────────────
    console.log('🎒 Creating student user...');
    const studentUserId = uuidv4();
    const studentProfileId = uuidv4();
    await db.insert(users).values({
      id: studentUserId,
      email: 'student@base2media.ac',
      passwordHash: await bcrypt.hash('student123', 10),
      role: 'student',
      name: 'Kwame Asante',
      isActive: true,
    });
    await db.insert(studentProfiles).values({
      id: studentProfileId,
      userId: studentUserId,
      studentId: 'B2MA-2024-001',
      firstName: 'Kwame',
      lastName: 'Asante',
      gender: 'Male',
      phone: '+233 20 123 4567',
      classId: classIds.c1,
      enrollmentDate: '2024-09-01',
      status: 'active',
    });

    // ─── Parent User ──────────────────────────────────────────
    console.log('👪 Creating parent user...');
    const parentUserId = uuidv4();
    await db.insert(users).values({
      id: parentUserId,
      email: 'parent@base2media.ac',
      passwordHash: await bcrypt.hash('parent123', 10),
      role: 'parent',
      name: 'Mr. Kofi Asante',
      isActive: true,
    });
    await db.insert(parentProfiles).values({
      userId: parentUserId,
      firstName: 'Kofi',
      lastName: 'Asante',
      phone: '+233 20 987 6543',
      studentId: studentProfileId,
    });

    console.log('\n✅ Database seeded successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log('🔑 Demo Login Credentials:');
    console.log('   Admin   → admin@base2media.ac   / admin123');
    console.log('   Staff   → staff@base2media.ac   / staff123');
    console.log('   Student → student@base2media.ac / student123');
    console.log('   Parent  → parent@base2media.ac  / parent123');
    console.log('─────────────────────────────────────────\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
