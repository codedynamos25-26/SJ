/**
 * Run to clean the database and populate only the admin user:
 *   npx ts-node src/db/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db, users, events, challenges, projects, teamMembers } from './index'

async function seed() {
  console.log('Cleaning up database tables...')

  // Delete all existing data from all tables
  await db.delete(events)
  await db.delete(challenges)
  await db.delete(projects)
  await db.delete(teamMembers)
  await db.delete(users)

  console.log('Seeding admin user...')
  await db.insert(users).values([
    {
      id: 'u1',
      email: 'admin@codedynamos.io',
      name: 'Admin',
      role: 'admin',
      passwordHash: bcrypt.hashSync('sujaljaya$2025yr', 10),
      usn: 'ADMIN01',
      department: 'SuperAdmin',
      year: 'N/A',
      githubUrl: 'https://github.com/admin',
      xp: 100000,
      rank: 1,
      track: 'Fullstack',
    }
  ]).onConflictDoUpdate({
    target: users.id,
    set: {
      passwordHash: bcrypt.hashSync('sujaljaya$2025yr', 10),
      role: 'admin'
    }
  })

  console.log('✅ Database cleaned. Only admin seeded successfully.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
