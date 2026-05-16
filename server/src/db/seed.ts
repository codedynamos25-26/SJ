/**
 * Run once to populate the database with initial data:
 *   npx ts-node src/db/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db, users, events, challenges, projects, teamMembers } from './index'
import { team } from '../data/team'
import { challenges as challengesData } from '../data/challenges'
import { events as eventsData } from '../data/events'

async function seed() {
  console.log('Seeding database...')

  // ── Team Members ───────────────────────────────────────────────────────────
  console.log('Seeding team members...')
  for (const member of team) {
    await db.insert(teamMembers).values({
      id: member.id,
      name: member.name,
      role: member.role,
      dept: member.dept,
      tier: member.tier,
      image: member.image || null
    }).onConflictDoUpdate({
      target: teamMembers.id,
      set: {
        name: member.name,
        role: member.role,
        dept: member.dept,
        tier: member.tier,
        image: member.image || null
      }
    })
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('Seeding users...')
  await db.insert(users).values([
    {
      id: 'u1', email: 'admin@codedynamos.io', name: 'Aayan Joshi',
      role: 'admin', passwordHash: bcrypt.hashSync('Admin@1234', 10),
      usn: '1RV19CS001', department: 'CSE', year: '4th', githubUrl: 'https://github.com/admin',
      xp: 18540, rank: 1, track: 'Fullstack',
    },
    {
      id: 'u2', email: 'arjun@codedynamos.io', name: 'Arjun Mehta',
      role: 'member', passwordHash: bcrypt.hashSync('Member@1234', 10),
      usn: '1RV20IS045', department: 'ISE', year: '3rd', githubUrl: 'https://github.com/arjun',
      xp: 10900, rank: 4, track: 'Backend',
    },
    {
      id: 'u3', email: 'priya@codedynamos.io', name: 'Priya Sharma',
      role: 'member', passwordHash: bcrypt.hashSync('Member@1234', 10),
      usn: '1RV21AI021', department: 'AI', year: '2nd', githubUrl: 'https://github.com/priya',
      xp: 14820, rank: 2, track: 'ML',
    },
    {
      id: 'u4', email: 'karan@codedynamos.io', name: 'Karan Nair',
      role: 'member', passwordHash: bcrypt.hashSync('Member@1234', 10),
      usn: '1RV21CS099', department: 'CSE', year: '2nd', githubUrl: 'https://github.com/karan',
      xp: 18540, rank: 1, track: 'Security',
    },
  ]).onConflictDoNothing()

  // ── Challenges ─────────────────────────────────────────────────────────────
  console.log('Seeding challenges...')
  const challengeBatch = challengesData.map(c => ({
    id: c.id,
    title: c.title,
    difficulty: c.difficulty,
    xp: c.xp,
    pool: c.pool,
    completions: c.completions,
    participants: c.participants,
    tags: c.tags,
    description: c.description
  }))
  await db.insert(challenges).values(challengeBatch).onConflictDoNothing()

  // ── Events ─────────────────────────────────────────────────────────────────
  console.log('Seeding events...')
  const eventBatch = eventsData.map(e => ({
    id: e.id,
    type: e.type,
    date: e.date,
    title: e.title,
    description: e.description,
    slots: e.slots,
    total: e.total,
    status: e.status,
    location: e.location,
    accent: e.accent,
    image: e.image,
    platform: e.platform || null,
    externalUrl: e.externalUrl || null,
  }))
  await db.insert(events).values(eventBatch).onConflictDoNothing()

  // ── Projects ───────────────────────────────────────────────────────────────
  console.log('Seeding projects...')
  await db.insert(projects).values([
    {
      id: 'p1', title: 'Taikyoku', description: 'Advanced AI-powered coding pair.', status: 'Live',
      tech: ['React', 'Node.js'], stars: 154, forks: 20, img: ''
    }
  ]).onConflictDoNothing()

  console.log('✅ Seed complete')
  process.exit(0)
}

seed().catch((err) => { console.error(err); process.exit(1) })
