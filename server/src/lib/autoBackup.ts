import fs from 'fs'
import path from 'path'
import { db, users, events, challenges, projects, gallery, announcements, teamMembers, userActiveChallenges, userEnrolledEvents } from '../db'

const BACKUP_DIR = path.resolve(__dirname, '../../backups')
const MAX_BACKUPS = 10
const COOLDOWN_MS = 15 * 60 * 1000 // 15 minutes throttle cooldown

let lastBackupTimestamp = 0
let isBackingUp = false

export interface BackupPayload {
  version: string
  timestamp: string
  counts: Record<string, number>
  data: Record<string, any[]>
}

/**
 * Creates an automated, non-blocking backup snapshot of all tables.
 * Throttled to a maximum of once every 15 minutes to eliminate server/database overhead.
 */
export const createAutoBackup = async (force = false): Promise<BackupPayload | null> => {
  const nowMs = Date.now()

  // If a backup was run recently and not forced, skip immediately (0 DB queries)
  if (!force && nowMs - lastBackupTimestamp < COOLDOWN_MS) {
    return getLatestSnapshot()
  }

  // Prevent multiple concurrent backup operations
  if (isBackingUp) {
    return getLatestSnapshot()
  }

  isBackingUp = true

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const [
      allUsers,
      allEvents,
      allChallenges,
      allTeam,
      allGallery,
      allProjects,
      allAnnouncements,
      allEnrolledEvents,
      allActiveChallenges,
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(events),
      db.select().from(challenges),
      db.select().from(teamMembers),
      db.select().from(gallery),
      db.select().from(projects),
      db.select().from(announcements),
      db.select().from(userEnrolledEvents),
      db.select().from(userActiveChallenges),
    ])

    const now = new Date()
    const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)

    const backupPayload: BackupPayload = {
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

    const filename = `auto-backup-${timestampStr}.json`
    const filepath = path.join(BACKUP_DIR, filename)
    const latestFilepath = path.join(BACKUP_DIR, 'latest-snapshot.json')

    const jsonString = JSON.stringify(backupPayload, null, 2)
    fs.writeFileSync(filepath, jsonString, 'utf-8')
    fs.writeFileSync(latestFilepath, jsonString, 'utf-8')

    // Prune older backup files to avoid disk usage accumulation
    cleanOldBackups()

    lastBackupTimestamp = Date.now()

    console.log(`🛡️ [AutoBackup] Automated database snapshot created (${now.toLocaleTimeString()}) — Total records: ${
      Object.values(backupPayload.counts).reduce((a, b) => a + b, 0)
    }`)

    return backupPayload
  } catch (error) {
    console.warn('⚠️ [AutoBackup] Automated database snapshot warning:', error instanceof Error ? error.message : error)
    return null
  } finally {
    isBackingUp = false
  }
}

/**
 * Clean older backup files keeping only the latest MAX_BACKUPS.
 */
const cleanOldBackups = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('auto-backup-') && f.endsWith('.json'))
      .sort()
      .reverse()

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS)
      for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, file))
      }
    }
  } catch (err) {
    console.warn('[AutoBackup] Cleanup warning:', err)
  }
}

/**
 * Returns the most recent snapshot available on disk.
 */
export const getLatestSnapshot = (): BackupPayload | null => {
  try {
    const latestFilepath = path.join(BACKUP_DIR, 'latest-snapshot.json')
    if (fs.existsSync(latestFilepath)) {
      const content = fs.readFileSync(latestFilepath, 'utf-8')
      return JSON.parse(content)
    }
  } catch {}
  return null
}
