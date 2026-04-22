import 'dotenv/config';
import postgres from 'postgres';

async function cleanup() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  const sql = postgres(process.env.DATABASE_URL);

  console.log('Cleaning up duplicate leetcode_url...');
  try {
    // Find duplicates and set them to NULL except for one (or just nullify all if they are just sujalmj)
    await sql`UPDATE users SET leetcode_url = NULL WHERE id NOT IN (
      SELECT MIN(id) FROM users GROUP BY leetcode_url
    ) AND leetcode_url IS NOT NULL;`;

    console.log('Adding unique constraint...');
    await sql`ALTER TABLE users ADD CONSTRAINT unique_leetcode_url UNIQUE (leetcode_url);`;
    
    console.log('Cleanup and Constraint added successfully!');
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await sql.end();
  }
}

cleanup();
