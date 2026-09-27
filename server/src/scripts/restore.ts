import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { db, users, events, challenges, projects, gallery, announcements, teamMembers, userActiveChallenges, userEnrolledEvents } from '../db'

async function runRestore() {
  const args = process.argv.slice(2)
  const backupDir = path.resolve(__dirname, '../../backups')
  let targetFile = args[0]

  if (!targetFile) {
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.json')).sort().reverse()
      if (files.length > 0) {
        targetFile = path.join(backupDir, files[0])
        console.log(`ℹ️ No file specified. Using latest backup: ${files[0]}`)
      }
    }
  }

  if (!targetFile || !fs.existsSync(targetFile)) {
    console.error('❌ Error: Backup file not found.')
    console.error('Usage: npm run db:restore [path-to-backup.json]')
    process.exit(1)
  }

  console.log(`🔄 Reading backup file from: ${targetFile}`)
  const rawData = fs.readFileSync(targetFile, 'utf-8')
  const parsed = JSON.parse(rawData)
  const data = parsed.data || parsed

  let restoredCount = 0

  console.log('⏳ Restoring records into database...')

  // 1. Users
  if (Array.isArray(data.users) && data.users.length > 0) {
    for (const u of data.users) {
      if (!u.id || !u.email) continue
      await db.insert(users).values({
        ...u,
        resetTokenExpiry: u.resetTokenExpiry ? new Date(u.resetTokenExpiry) : null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          name: u.name,
          email: u.email,
          role: u.role ?? 'member',
          xp: u.xp ?? 0,
          rank: u.rank ?? 0,
          usn: u.usn,
          department: u.department,
          year: u.year,
          semester: u.semester,
          githubUrl: u.githubUrl,
          leetcodeProfile: u.leetcodeProfile,
          leetcodeSolved: u.leetcodeSolved ?? 0,
          leetcodeRating: u.leetcodeRating ?? 0,
          track: u.track ?? 'Fullstack',
        }
      })
      restoredCount++
    }
  }

  // 2. Events
  if (Array.isArray(data.events) && data.events.length > 0) {
    for (const e of data.events) {
      if (!e.id || !e.title) continue
      await db.insert(events).values({
        ...e,
        endsAt: e.endsAt ? new Date(e.endsAt) : null,
      }).onConflictDoUpdate({
        target: events.id,
        set: {
          title: e.title,
          description: e.description,
          type: e.type,
          date: e.date,
          slots: e.slots,
          total: e.total,
          status: e.status,
          location: e.location,
          accent: e.accent,
          image: e.image,
          platform: e.platform,
          externalUrl: e.externalUrl,
          benefits: e.benefits ?? [],
          schedule: e.schedule ?? [],
          requirements: e.requirements ?? [],
          enrollmentXp: e.enrollmentXp ?? 0,
          endsAt: e.endsAt ? new Date(e.endsAt) : null,
        }
      })
      restoredCount++
    }
  }

  // 3. Challenges
  if (Array.isArray(data.challenges) && data.challenges.length > 0) {
    for (const c of data.challenges) {
      if (!c.id || !c.title) continue
      await db.insert(challenges).values({
        ...c,
        endsAt: c.endsAt ? new Date(c.endsAt) : null,
      }).onConflictDoUpdate({
        target: challenges.id,
        set: {
          title: c.title,
          difficulty: c.difficulty,
          xp: c.xp,
          pool: c.pool,
          completions: c.completions ?? 0,
          participants: c.participants ?? 0,
          tags: c.tags ?? [],
          description: c.description,
          requirements: c.requirements ?? [],
          timeline: c.timeline ?? [],
          prizes: c.prizes ?? [],
          status: c.status ?? 'Open',
          image: c.image,
          enrollmentXp: c.enrollmentXp ?? 0,
          externalUrl: c.externalUrl,
          endsAt: c.endsAt ? new Date(c.endsAt) : null,
        }
      })
      restoredCount++
    }
  }

  // 4. Team Members
  if (Array.isArray(data.teamMembers) && data.teamMembers.length > 0) {
    for (const t of data.teamMembers) {
      if (!t.id || !t.name) continue
      await db.insert(teamMembers).values(t).onConflictDoUpdate({
        target: teamMembers.id,
        set: {
          name: t.name,
          role: t.role,
          dept: t.dept,
          instagramUrl: t.instagramUrl,
          linkedinUrl: t.linkedinUrl,
          tier: t.tier ?? 'Core',
          image: t.image,
        }
      })
      restoredCount++
    }
  }

  // 5. Gallery
  if (Array.isArray(data.gallery) && data.gallery.length > 0) {
    for (const g of data.gallery) {
      if (!g.id || !g.img) continue
      await db.insert(gallery).values(g).onConflictDoUpdate({
        target: gallery.id,
        set: {
          tag: g.tag,
          year: g.year,
          label: g.label,
          span: g.span,
          img: g.img,
          driveUrl: g.driveUrl,
        }
      })
      restoredCount++
    }
  }

  // 6. Projects
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    for (const p of data.projects) {
      if (!p.id || !p.title) continue
      await db.insert(projects).values(p).onConflictDoUpdate({
        target: projects.id,
        set: {
          title: p.title,
          description: p.description,
          status: p.status,
          tech: p.tech ?? [],
          stars: p.stars ?? 0,
          forks: p.forks ?? 0,
          img: p.img,
          githubUrl: p.githubUrl,
        }
      })
      restoredCount++
    }
  }

  // 7. Announcements
  if (Array.isArray(data.announcements) && data.announcements.length > 0) {
    for (const a of data.announcements) {
      if (!a.id || !a.text) continue
      await db.insert(announcements).values({
        ...a,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
      }).onConflictDoUpdate({
        target: announcements.id,
        set: {
          text: a.text,
          active: a.active ?? true,
        }
      })
      restoredCount++
    }
  }

  // 8. Enrollments
  if (Array.isArray(data.userEnrolledEvents) && data.userEnrolledEvents.length > 0) {
    for (const ue of data.userEnrolledEvents) {
      if (!ue.userId || !ue.eventId) continue
      try {
        await db.insert(userEnrolledEvents).values({
          ...ue,
          enrolledAt: ue.enrolledAt ? new Date(ue.enrolledAt) : new Date(),
        }).onConflictDoNothing()
        restoredCount++
      } catch {}
    }
  }

  // 9. Active Challenges
  if (Array.isArray(data.userActiveChallenges) && data.userActiveChallenges.length > 0) {
    for (const uc of data.userActiveChallenges) {
      if (!uc.userId || !uc.challengeId) continue
      try {
        await db.insert(userActiveChallenges).values({
          ...uc,
          enrolledAt: uc.enrolledAt ? new Date(uc.enrolledAt) : new Date(),
        }).onConflictDoNothing()
        restoredCount++
      } catch {}
    }
  }

  console.log(`✅ Restore completed successfully!`)
  console.log(`📊 Total records restored/updated: ${restoredCount}`)
  process.exit(0)
}

runRestore().catch((err) => {
  console.error('❌ Restore failed:', err)
  process.exit(1)
})
