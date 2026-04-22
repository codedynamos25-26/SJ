import 'dotenv/config';
import postgres from 'postgres';

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  const sql = postgres(process.env.DATABASE_URL);

  console.log('Updating schema (unique constraint and ends_at columns)...');
  try {
    // 1. Add unique constraint to leetcode_url (might fail if duplicates already exist, but we assume it's fresh enough)
    // We use a try-catch for the constraint specifically
    try {
      await sql`ALTER TABLE users ADD CONSTRAINT unique_leetcode_url UNIQUE (leetcode_url);`;
      console.log('Added unique constraint to leetcode_url');
    } catch (e) {
      console.warn('Could not add unique constraint to leetcode_url (maybe it already exists or there are duplicates):', e);
    }

    // 2. Add ends_at to events
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;`;
    
    // 3. Add ends_at to challenges
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;`;

    // 4. Add editable challenge detail fields
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT ARRAY[]::TEXT[];`;
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS timeline TEXT[] DEFAULT ARRAY[]::TEXT[];`;
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS prizes TEXT[] DEFAULT ARRAY[]::TEXT[];`;

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
