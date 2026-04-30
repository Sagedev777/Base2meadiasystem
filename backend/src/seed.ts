import { db } from './db';
import {
  users, terms, classes, studentProfiles, staffProfiles,
  parentProfiles, subjects, classSubjects, grades,
  attendance, auditLogs, refreshTokens,
} from './db/schema';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function seed() {
  console.log('\n🌱 Seeding Base2 Science and Media Academy database...\n');

  try {
    // ─── Clear ALL data (FK-safe order) ──────────────────────
    console.log('🧹 Clearing all existing data...');
    await db.delete(auditLogs).execute();
    await db.delete(refreshTokens).execute();
    await db.delete(grades).execute();
    await db.delete(attendance).execute();
    await db.delete(classSubjects).execute();
    await db.delete(parentProfiles).execute();
    await db.delete(staffProfiles).execute();
    await db.delete(studentProfiles).execute();
    await db.delete(users).execute();
    await db.delete(classes).execute();
    await db.delete(terms).execute();
    await db.delete(subjects).execute();

    // ─── Admin User Only ──────────────────────────────────────
    console.log('👨‍💼 Creating admin user...');
    await db.insert(users).values({
      id: uuidv4(),
      email: 'admin@base2media.ac',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      name: 'Administrator',
      isActive: true,
    });

    console.log('\n✅ Database seeded successfully!\n');
    console.log('─────────────────────────────────────────');
    console.log('🔑 Admin Login:');
    console.log('   Email    → admin@base2media.ac');
    console.log('   Password → admin123');
    console.log('─────────────────────────────────────────');
    console.log('ℹ️  System is empty. Add terms, courses, staff and students via the UI.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
