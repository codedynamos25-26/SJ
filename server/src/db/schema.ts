import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:               text('id').primaryKey(),
  email:            text('email').notNull().unique(),
  name:             text('name').notNull(),
  role:             text('role').notNull().default('member'),   // 'member' | 'admin'
  passwordHash:     text('password_hash'),                      // null for Google-only accounts
  googleId:         text('google_id').unique(),
  xp:               integer('xp').notNull().default(0),
  rank:             integer('rank').notNull().default(0),
  challenges:       integer('challenges').notNull().default(0),
  streak:           integer('streak').notNull().default(0),
  badge:            text('badge').notNull().default('Member'),
  track:            text('track').notNull().default('Fullstack'),
  createdAt:        timestamp('created_at').defaultNow(),
})

export const events = pgTable('events', {
  id:          text('id').primaryKey(),
  type:        text('type').notNull(),
  date:        text('date').notNull(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  slots:       integer('slots').notNull(),
  total:       integer('total').notNull(),
  status:      text('status').notNull().default('Open'),
  location:    text('location').notNull(),
  accent:      text('accent').notNull().default('#d3ef57'),
  image:       text('image'),
  platform:    text('platform'),
  externalUrl: text('external_url'),
})

export const challenges = pgTable('challenges', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  difficulty:  text('difficulty').notNull(),
  xp:          integer('xp').notNull(),
  pool:        integer('pool').notNull(),
  completions: integer('completions').notNull().default(0),
  participants:integer('participants').notNull().default(0),
  tags:        text('tags').array().notNull().default([]),   // text[]
  description: text('description').notNull(),
})

export const projects = pgTable('projects', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  status:      text('status').notNull().default('Beta'),
  tech:        text('tech').array().notNull().default([]),
  stars:       integer('stars').notNull().default(0),
  forks:       integer('forks').notNull().default(0),
  img:         text('img').notNull().default(''),
})

export const gallery = pgTable('gallery', {
  id:    text('id').primaryKey(),
  tag:   text('tag').notNull(),
  year:  text('year').notNull(),
  label: text('label').notNull(),
  span:  text('span').notNull().default(''),
  img:   text('img').notNull(),
})

// Join tables for many-to-many
export const userEnrolledEvents = pgTable('user_enrolled_events', {
  userId:  text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
})

export const userActiveChallenges = pgTable('user_active_challenges', {
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: text('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  completed:   boolean('completed').notNull().default(false),
  progress:    integer('progress').notNull().default(0),
})


