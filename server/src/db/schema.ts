import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('member'),   // 'member' | 'admin'
  passwordHash: text('password_hash'),                      // null for Google-only accounts
  googleId: text('google_id').unique(),
  xp: integer('xp').notNull().default(0),
  rank: integer('rank').notNull().default(0),
  usn: text('usn'),
  department: text('department'),
  year: text('year'),
  semester: text('semester'),
  githubUrl: text('github_url'),
  // Map to existing production columns to avoid destructive migration
  leetcodeProfile: text('leetcode_url'),
  leetcodeSolved: integer('leetcode_solved').notNull().default(0),
  leetcodeRating: integer('leetcode_rating').notNull().default(0),
  track: text('track').notNull().default('Fullstack'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  dept: text('department').notNull(),
  instagramUrl: text('instagram_url'),
  linkedinUrl: text('linkedin_url'),
  tier: text('category').notNull().default('Core'),
  image: text('image'),
})

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slots: integer('slots').notNull(),
  total: integer('total').notNull(),
  status: text('status').notNull().default('Open'),
  location: text('location').notNull(),
  accent: text('accent').notNull().default('#d3ef57'),
  image: text('image'),
  platform: text('platform'),
  externalUrl: text('external_url'),
  benefits: text('benefits').array().notNull().default([]),
  schedule: text('schedule').array().notNull().default([]),
  requirements: text('requirements').array().notNull().default([]),
  enrollmentXp: integer('enrollment_xp').notNull().default(0),
  endsAt: timestamp('ends_at'),
})

export const challenges = pgTable('challenges', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  difficulty: text('difficulty').notNull(),
  xp: integer('xp').notNull(),
  pool: integer('pool').notNull(),
  completions: integer('completions').notNull().default(0),
  participants: integer('participants').notNull().default(0),
  tags: text('tags').array().notNull().default([]),   // text[]
  description: text('description').notNull(),
  requirements: text('requirements').array().notNull().default([]),
  timeline: text('timeline').array().notNull().default([]),
  prizes: text('prizes').array().notNull().default([]),
  status: text('status').notNull().default('Open'), // Open | Closed
  enrollmentXp: integer('enrollment_xp').notNull().default(0),
  externalUrl: text('external_url'),
  endsAt: timestamp('ends_at'),
})

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('Beta'),
  tech: text('tech').array().notNull().default([]),
  stars: integer('stars').notNull().default(0),
  forks: integer('forks').notNull().default(0),
  img: text('img').notNull().default(''),
  githubUrl: text('github_url'),
})

export const gallery = pgTable('gallery', {
  id: text('id').primaryKey(),
  tag: text('tag').notNull(),
  year: text('year').notNull(),
  label: text('label').notNull(),
  span: text('span').notNull().default(''),
  img: text('img').notNull(),
  driveUrl: text('drive_url'),   // if set, card opens Drive link instead of lightbox
})

// Join tables for many-to-many
export const userEnrolledEvents = pgTable('user_enrolled_events', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
  position: integer('position'), // 1, 2, 3...
  awardXp: integer('award_xp').notNull().default(0),
})

export const userActiveChallenges = pgTable('user_active_challenges', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: text('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  completed: boolean('completed').notNull().default(false),
  verified: boolean('verified').notNull().default(false),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
  position: integer('position'), // 1, 2, 3...
  awardXp: integer('award_xp').notNull().default(0),
})


