import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('Updating staff_profiles...');
    try { await db.execute(sql`ALTER TABLE staff_profiles ADD COLUMN photo_url LONGTEXT`); } catch (e) {}
    try { await db.execute(sql`ALTER TABLE staff_profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE`); } catch (e) {}

    console.log('Ensuring class_subjects has term_id...');
    try { await db.execute(sql`ALTER TABLE class_subjects ADD COLUMN term_id VARCHAR(36)`); } catch (e) {}
    
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
  process.exit(0);
}

migrate();
