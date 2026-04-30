import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.execute(sql`DESCRIBE class_subjects`);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

check();
