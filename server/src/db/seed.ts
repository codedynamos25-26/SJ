/**
 * Run to clean the database and populate only the admin user and requested team members:
 *   npx ts-node src/db/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db, users, events, challenges, projects, teamMembers, announcements } from './index'

async function seed() {
  console.log('Cleaning up database tables...')

  // Delete all existing data from all tables
  await db.delete(events)
  await db.delete(challenges)
  await db.delete(projects)
  await db.delete(teamMembers)
  await db.delete(announcements)
  await db.delete(users)

  console.log('Seeding admin user...')
  await db.insert(users).values([
    {
      id: 'u1',
      email: 'adminsj@codedynamos.club',
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

  console.log('Seeding requested team members...')
  const tmNow = Date.now()
  await db.insert(teamMembers).values([
    {
      id: `tm-${tmNow}-1`,
      name: 'Dr. G. Shramila',
      role: 'Faculty Coordinator',
      dept: 'Core',
      tier: 'Faculty',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-2`,
      name: 'Sujal Jondhale',
      role: 'President',
      dept: 'Core',
      tier: 'Core',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-3`,
      name: 'Jayaduran T',
      role: 'Vice President',
      dept: 'Core',
      tier: 'Core',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-4`,
      name: 'Sai Niranjanaa D',
      role: 'Club Secretary',
      dept: 'Core',
      tier: 'Core',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-5`,
      name: 'Abhishek C k',
      role: 'Technical Lead',
      dept: 'Technical',
      tier: 'Technical',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-6`,
      name: 'Sidhant Saswat',
      role: 'Technical Associate',
      dept: 'Technical',
      tier: 'Technical',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-7`,
      name: 'Kavin',
      role: 'Marketing Team',
      dept: 'Marketing',
      tier: 'Marketing',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    },
    {
      id: `tm-${tmNow}-8`,
      name: 'Dikshith',
      role: 'Marketing Team',
      dept: 'Marketing',
      tier: 'Marketing',
      instagramUrl: null,
      linkedinUrl: null,
      image: null
    }
  ])

  console.log('✅ Database cleaned and seeded successfully.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
