const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    await conn.execute('ALTER TABLE student_profiles ADD COLUMN enrolled_course_ids TEXT');
    console.log("Added enrolled_course_ids column to student_profiles.");
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Column already exists.");
    } else {
      console.error(err);
    }
  }
  
  process.exit(0);
}
run();
