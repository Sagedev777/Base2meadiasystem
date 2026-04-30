import { db } from './db';
import { terms, classes } from './db/schema';
import { v4 as uuidv4 } from 'uuid';

async function seedClasses() {
  console.log('🌱 Seeding Terms and Classes...');

  const termId = uuidv4();
  await db.insert(terms).values({
    id: termId,
    name: 'Term 1 - 2026',
    startDate: '2026-01-15',
    endDate: '2026-04-15',
    isCurrent: true,
  });

  // 2. Create Classes
  console.log('🏫 Creating classes for departments...');
  await db.insert(classes).values([
    { name: 'Creative Media Class', termId, capacity: 40 },
    { name: 'Audio & Music Class', termId, capacity: 40 },
    { name: 'IT & Technology Class', termId, capacity: 40 },
    { name: 'Short Courses & Masterclasses', termId, capacity: 50 },
  ]);

  console.log('✅ Terms and Classes seeded successfully!');
  process.exit(0);
}

seedClasses().catch(err => {
  console.error('❌ Failed to seed classes:', err);
  process.exit(1);
});
