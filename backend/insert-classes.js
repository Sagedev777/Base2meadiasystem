const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Create a default term if missing
  const [terms] = await conn.execute('SELECT * FROM terms WHERE name = "Current Term"');
  let termId;
  if (terms.length === 0) {
    termId = uuidv4();
    await conn.execute('INSERT INTO terms (id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)', [termId, 'Current Term', '2025-01-01', '2025-06-01', 1]);
  } else {
    termId = terms[0].id;
  }

  const categories = ['Creative Media', 'Audio & Music', 'IT & Technology'];
  for (const cat of categories) {
    const [rows] = await conn.execute('SELECT * FROM classes WHERE id = ?', [cat]);
    if (rows.length === 0) {
      await conn.execute('INSERT INTO classes (id, name, term_id, capacity) VALUES (?, ?, ?, ?)', [cat, cat, termId, 100]);
    }
  }
  
  console.log("Categories inserted into classes table.");
  process.exit(0);
}
run();
