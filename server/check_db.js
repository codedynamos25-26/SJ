require('dotenv').config();
const postgres = require('postgres');

async function run() {
  const isCloudDb = process.env.DATABASE_URL.includes('render.com') ||
    process.env.DATABASE_URL.includes('neon.tech') ||
    process.env.DATABASE_URL.includes('supabase.co') ||
    process.env.DATABASE_URL.includes('ssl=true');

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: isCloudDb ? 'require' : false,
  });

  try {
    console.log('Querying table info for announcements...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'announcements'
    `;
    console.log('Announcements columns:', columns);

    console.log('Querying all tables in database...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables:', tables.map(t => t.table_name));
  } catch (err) {
    console.error('Error running query:', err);
  } finally {
    await sql.end();
  }
}

run();
