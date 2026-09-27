import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { db, users, events, challenges, projects, gallery, announcements, teamMembers, userActiveChallenges, userEnrolledEvents } from '../db'

async function runBackup() {
  console.log('🔄 Starting database backup...')
  try {
    const allUsers = await db.select().from(users)
    const allEvents = await db.select().from(events)
    const allChallenges = await db.select().from(challenges)
    const allTeam = await db.select().from(teamMembers)
    const allGallery = await db.select().from(gallery)
    const allProjects = await db.select().from(projects)
    const allAnnouncements = await db.select().from(announcements)
    const allEnrolledEvents = await db.select().from(userEnrolledEvents)
    const allActiveChallenges = await db.select().from(userActiveChallenges)

    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupDir = path.resolve(__dirname, '../../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filename = `backup-${timestamp}.json`
    const filepath = path.join(backupDir, filename)

    const backup = {
      version: '2.0',
      timestamp: now.toISOString(),
      counts: {
        users: allUsers.length,
        events: allEvents.length,
        challenges: allChallenges.length,
        teamMembers: allTeam.length,
        gallery: allGallery.length,
        projects: allProjects.length,
        announcements: allAnnouncements.length,
        userEnrolledEvents: allEnrolledEvents.length,
        userActiveChallenges: allActiveChallenges.length,
      },
      data: {
        users: allUsers,
        events: allEvents,
        challenges: allChallenges,
        teamMembers: allTeam,
        gallery: allGallery,
        projects: allProjects,
        announcements: allAnnouncements,
        userEnrolledEvents: allEnrolledEvents,
        userActiveChallenges: allActiveChallenges,
      },
    }

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8')
    console.log(`✅ Backup created successfully!`)
    console.log(`📁 File saved to: ${filepath}`)
    console.log(`📊 Total records backed up:`)
    console.table(backup.counts)
    process.exit(0)
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    process.exit(1)
  }
}

runBackup()
