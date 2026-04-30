import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Adding total_fee to student_profiles...');
    try {
      await db.execute(sql`ALTER TABLE student_profiles ADD COLUMN total_fee DECIMAL(12,2)`);
    } catch (e) {}

    console.log('Creating subject_assignments table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subject_assignments (
        id VARCHAR(36) PRIMARY KEY,
        staff_id VARCHAR(36),
        subject_id VARCHAR(36),
        class_id VARCHAR(36),
        term_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
      )
    `);

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
