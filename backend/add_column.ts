import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Adding class_name to student_profiles...');
    await db.execute(sql`ALTER TABLE student_profiles ADD COLUMN class_name VARCHAR(100) AFTER status`);
    console.log('Success!');
  } catch (err: any) {
    if (err.message.includes('Duplicate column name')) {
      console.log('Column already exists.');
    } else {
      console.error('Migration failed:', err);
    }
  }
  process.exit(0);
}

migrate();
