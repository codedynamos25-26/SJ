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
      id: 'u1', email: 'admin@codedynamos.io', name: 'Admin',
      role: 'admin', passwordHash: bcrypt.hashSync('sujaljaya$2025yr', 10),
      usn: 'ADMIN01', department: 'SuperAdmin', year: 'N/A', githubUrl: 'https://github.com/admin',
      xp: 100000, rank: 1, track: 'Fullstack',
    }
  ]).onConflictDoUpdate({
    target: users.id,
    set: {
      passwordHash: bcrypt.hashSync('sujaljaya$2025yr', 10),
      role: 'admin'
    }
  })

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
