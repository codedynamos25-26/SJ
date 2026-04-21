/**
 * Run once to populate the database with initial data:
 *   npx ts-node src/db/seed.ts
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db, users, events, challenges, projects, gallery, userEnrolledEvents, userActiveChallenges } from './index'

async function seed() {
  console.log('Seeding database...')

  // ── Users ──────────────────────────────────────────────────────────────────
  await db.insert(users).values([
    {
      id: 'u1', email: 'admin@codedynamos.io', name: 'Aayan Joshi',
      role: 'admin', passwordHash: bcrypt.hashSync('Admin@1234', 10),
      xp: 18540, rank: 1, challenges: 47, streak: 12, badge: 'Legendary',
      track: 'Fullstack',
    },
    {
      id: 'u2', email: 'arjun@codedynamos.io', name: 'Arjun Mehta',
      role: 'member', passwordHash: bcrypt.hashSync('Member@1234', 10),
      xp: 10900, rank: 4, challenges: 28, streak: 3, badge: 'Expert',
      track: 'Backend',
    },
    {
      id: 'u3', email: 'priya@codedynamos.io', name: 'Priya Sharma',
      role: 'member', passwordHash: bcrypt.hashSync('Member@1234', 10),
      xp: 14820, rank: 2, challenges: 38, streak: 8, badge: 'Architect',
      track: 'ML',
    },
    {
      id: 'u4', email: 'karan@codedynamos.io', name: 'Karan Nair',
      role: 'member', passwordHash: bcrypt.hashSync('Member@1234', 10),
      xp: 18540, rank: 1, challenges: 47, streak: 12, badge: 'Legendary',
      track: 'Security',
    },
  ]).onConflictDoNothing()

  // ── Events ─────────────────────────────────────────────────────────────────
  await db.insert(events).values([
    { id: 'ev1', type: 'Workshop', date: 'MAY 24', title: 'Advanced Rust Systems Programming', description: 'Deep-dive into Rust memory model, async runtimes, and systems-level performance.', slots: 8, total: 30, status: 'Open', location: 'Lab 3B', accent: '#d3ef57', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXn_-T0r_UBnvyAglmFKHY5SDS8pe33avm0AXhQOgO_pWfjILY84z7cCOrT4CTe95irAZzgKBdWIsp8vx0GeYXYcf_udQPu3L3nIySJOsv7pJBVdGGs6CwVm9O_Azd4FefJSyt2cki706imdO1WQYLTEl_zC2TDvSbK9zOzN75S0gBbzlIQwKEID519kvxQnq51eJSpZE1FV_Au4nYRrLUr8P0hHQGIiFsYLu-xecP_ErTnk6-Yi-o1TEkEU3C3JeIKskJgXfswg' },
    { id: 'ev2', type: 'Hackathon', date: 'JUL 05', title: "Cloud Native Sprint — Web Weave '26", description: '48-hour hackathon building cloud-native apps with Kubernetes, serverless, and edge computing.', slots: 0, total: 120, status: 'Full', location: 'Main Auditorium', accent: '#dbb8ff', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv5Fzz17-szQHNuORsgeozQsFTnlFtyDmKKZABXD6NDOwCS8wG9dfPcPugyI2fqMSQ-R3VQ-pZRZ05Hyz1QrHqCvePVKU3pW_ZxHyBegnLjB5e-ja2ZR3c_TYaslwbUtI17NhK2IKwJK7zGiXCAZThPCKhsKzwf13jHViOFnPbe9bL3lDhSiqgQlytPnWaoJl0g3h_oJLmbjmssITVnJ1E_29Gous4Rw_EVZpKUm6rwGFCxl1vEA9p7WrBp5jU0HovIs95LTFRlQ' },
    { id: 'ev3', type: 'Meetup', date: 'APR 18', title: 'Open Source Contribution Night', description: 'Monthly meetup to collaborate on open source projects. Bring a PR or start one.', slots: 15, total: 40, status: 'Open', location: 'Rooftop Lounge', accent: '#74facb', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyENExTqDtoPgcm5nWzFqYCTIRFSbzmt41nIWHDgRTjWX8uSafcHb9rBFoGB6Al9amVPPF-QZXmHuAyme642ZKhf_n2v2esKFcgW1ys-uVfpGshzCH12SU_EOcSh7UYYNO0jR1Gv2Z1Q8wr203PGk1GiF8eqdL9CguEVeKMU0Hswl6olj5zZbXehtJj2hbmzutKkCZqOTyZNu6kg3D8Hi8as7IpnQUi-pdE4-DdckYYp8oTWVFvJgT-_xVHKe4AHajTnloCcvQfg' },
    { id: 'ev4', type: 'Competition', date: 'MAY 10', title: 'Code Golf Tournament S3', description: 'Solve algorithmic challenges in the fewest bytes possible. Any language allowed.', slots: 22, total: 50, status: 'Open', location: 'Online', accent: '#ffb4ab', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXn_-T0r_UBnvyAglmFKHY5SDS8pe33avm0AXhQOgO_pWfjILY84z7cCOrT4CTe95irAZzgKBdWIsp8vx0GeYXYcf_udQPu3L3nIySJOsv7pJBVdGGs6CwVm9O_Azd4FefJSyt2cki706imdO1WQYLTEl_zC2TDvSbK9zOzN75S0gBbzlIQwKEID519kvxQnq51eJSpZE1FV_Au4nYRrLUr8P0hHQGIiFsYLu-xecP_ErTnk6-Yi-o1TEkEU3C3JeIKskJgXfswg' },
    { id: 'ev5', type: 'Workshop', date: 'APR 27', title: 'LLM Fine-Tuning Bootcamp', description: 'Hands-on session fine-tuning open-source LLMs with LoRA adapters on consumer hardware.', slots: 3, total: 20, status: 'Closing Soon', location: 'GPU Lab', accent: '#dbb8ff', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyENExTqDtoPgcm5nWzFqYCTIRFSbzmt41nIWHDgRTjWX8uSafcHb9rBFoGB6Al9amVPPF-QZXmHuAyme642ZKhf_n2v2esKFcgW1ys-uVfpGshzCH12SU_EOcSh7UYYNO0jR1Gv2Z1Q8wr203PGk1GiF8eqdL9CguEVeKMU0Hswl6olj5zZbXehtJj2hbmzutKkCZqOTyZNu6kg3D8Hi8as7IpnQUi-pdE4-DdckYYp8oTWVFvJgT-_xVHKe4AHajTnloCcvQfg' },
    { id: 'ev6', type: 'Workshop', date: 'JUN 02', title: 'WebAssembly & Edge Computing', description: 'Build and deploy WASM modules to Cloudflare Workers. Performance benchmarking included.', slots: 18, total: 25, status: 'Open', location: 'Lab 2A', accent: '#d3ef57', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv5Fzz17-szQHNuORsgeozQsFTnlFtyDmKKZABXD6NDOwCS8wG9dfPcPugyI2fqMSQ-R3VQ-pZRZ05Hyz1QrHqCvePVKU3pW_ZxHyBegnLjB5e-ja2ZR3c_TYaslwbUtI17NhK2IKwJK7zGiXCAZThPCKhsKzwf13jHViOFnPbe9bL3lDhSiqgQlytPnWaoJl0g3h_oJLmbjmssITVnJ1E_29Gous4Rw_EVZpKUm6rwGFCxl1vEA9p7WrBp5jU0HovIs95LTFRlQ' },
  ]).onConflictDoNothing()

  // ── Challenges ─────────────────────────────────────────────────────────────
  await db.insert(challenges).values([
    { id: 'ch1', title: 'Query Ninja', difficulty: 'Hard', xp: 800, pool: 4000, completions: 38, participants: 142, tags: ['SQL', 'Optimization'], description: 'Optimize a slow 12-table JOIN query to run under 50ms on 10M rows.' },
    { id: 'ch2', title: 'API Rate Limiter', difficulty: 'Medium', xp: 500, pool: 2500, completions: 61, participants: 189, tags: ['Node.js', 'Redis', 'Algorithms'], description: 'Implement a sliding window rate limiter that survives 100k RPS with sub-1ms overhead.' },
    { id: 'ch3', title: 'Graph Weaver', difficulty: 'Legendary', xp: 1500, pool: 7500, completions: 12, participants: 97, tags: ['Graph Theory', 'DP'], description: 'Find the minimum cost path in a weighted directed graph with time-varying edge weights.' },
    { id: 'ch4', title: 'Cache Architect', difficulty: 'Hard', xp: 900, pool: 4500, completions: 29, participants: 114, tags: ['Systems', 'LRU', 'C++'], description: 'Build a lock-free LRU cache with O(1) get/put that handles concurrent writes safely.' },
    { id: 'ch5', title: 'Regex Wrangler', difficulty: 'Medium', xp: 450, pool: 2250, completions: 88, participants: 203, tags: ['Regex', 'Parsing'], description: 'Write a single regex that validates, extracts, and transforms a complex log format.' },
    { id: 'ch6', title: 'Packet Sniffer', difficulty: 'Legendary', xp: 2000, pool: 10000, completions: 7, participants: 58, tags: ['Networking', 'Security', 'Python'], description: 'Reconstruct TCP streams from raw packet captures and detect malicious payloads.' },
    { id: 'ch7', title: 'CSS Grid Master', difficulty: 'Easy', xp: 200, pool: 1000, completions: 201, participants: 312, tags: ['CSS', 'Frontend'], description: 'Replicate a complex magazine-style layout using only CSS Grid — no Flexbox allowed.' },
    { id: 'ch8', title: 'Async Maze', difficulty: 'Medium', xp: 600, pool: 3000, completions: 55, participants: 167, tags: ['JavaScript', 'Concurrency'], description: 'Solve a maze using parallel async workers. Minimize wall-clock time, not step count.' },
  ]).onConflictDoNothing()

  // ── Projects ───────────────────────────────────────────────────────────────
  await db.insert(projects).values([
    { id: 'p1', title: 'DynaMesh', description: 'Real-time collaborative code editor with CRDT-based conflict resolution and sub-50ms sync.', status: 'Live', tech: ['Rust', 'WebSockets', 'CRDT', 'React'], stars: 312, forks: 47, img: '' },
    { id: 'p2', title: 'SentinelBot', description: 'Automated CTF challenge solver using LLM-guided exploit generation and symbolic execution.', status: 'Beta', tech: ['Python', 'LLM', 'Angr', 'FastAPI'], stars: 189, forks: 28, img: '' },
    { id: 'p3', title: 'EdgeInfer', description: 'Run quantized LLMs on Raspberry Pi 5 at 12 tok/s using custom WASM inference engine.', status: 'Live', tech: ['C++', 'WASM', 'ONNX', 'Python'], stars: 445, forks: 71, img: '' },
    { id: 'p4', title: 'NetScope', description: 'Visual network topology mapper with passive traffic analysis and anomaly detection.', status: 'Archived', tech: ['Go', 'D3.js', 'pcap', 'ClickHouse'], stars: 98, forks: 15, img: '' },
    { id: 'p5', title: 'PromptForge', description: 'Prompt engineering toolkit with A/B testing, version control, and eval pipelines for LLMs.', status: 'Beta', tech: ['TypeScript', 'OpenAI', 'Postgres', 'tRPC'], stars: 267, forks: 39, img: '' },
    { id: 'p6', title: 'PulseOS', description: 'Minimal hobby OS kernel in Rust with RISC-V support, paging, and a basic scheduler.', status: 'Archived', tech: ['Rust', 'RISC-V', 'Assembly'], stars: 156, forks: 22, img: '' },
  ]).onConflictDoNothing()

  // ── Gallery ────────────────────────────────────────────────────────────────
  await db.insert(gallery).values([
    { id: 'g1', tag: 'Hackathons', year: '2026', label: 'Cloud Native Sprint Kickoff', span: 'row-span-2', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv5Fzz17-szQHNuORsgeozQsFTnlFtyDmKKZABXD6NDOwCS8wG9dfPcPugyI2fqMSQ-R3VQ-pZRZ05Hyz1QrHqCvePVKU3pW_ZxHyBegnLjB5e-ja2ZR3c_TYaslwbUtI17NhK2IKwJK7zGiXCAZThPCKhsKzwf13jHViOFnPbe9bL3lDhSiqgQlytPnWaoJl0g3h_oJLmbjmssITVnJ1E_29Gous4Rw_EVZpKUm6rwGFCxl1vEA9p7WrBp5jU0HovIs95LTFRlQ' },
    { id: 'g2', tag: 'Workshops', year: '2026', label: 'Rust Deep Dive Session', span: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXn_-T0r_UBnvyAglmFKHY5SDS8pe33avm0AXhQOgO_pWfjILY84z7cCOrT4CTe95irAZzgKBdWIsp8vx0GeYXYcf_udQPu3L3nIySJOsv7pJBVdGGs6CwVm9O_Azd4FefJSyt2cki706imdO1WQYLTEl_zC2TDvSbK9zOzN75S0gBbzlIQwKEID519kvxQnq51eJSpZE1FV_Au4nYRrLUr8P0hHQGIiFsYLu-xecP_ErTnk6-Yi-o1TEkEU3C3JeIKskJgXfswg' },
    { id: 'g3', tag: 'Workshops', year: '2025', label: 'LLM Ethics Panel', span: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyENExTqDtoPgcm5nWzFqYCTIRFSbzmt41nIWHDgRTjWX8uSafcHb9rBFoGB6Al9amVPPF-QZXmHuAyme642ZKhf_n2v2esKFcgW1ys-uVfpGshzCH12SU_EOcSh7UYYNO0jR1Gv2Z1Q8wr203PGk1GiF8eqdL9CguEVeKMU0Hswl6olj5zZbXehtJj2hbmzutKkCZqOTyZNu6kg3D8Hi8as7IpnQUi-pdE4-DdckYYp8oTWVFvJgT-_xVHKe4AHajTnloCcvQfg' },
  ]).onConflictDoNothing()

  // ── Join table seeds ───────────────────────────────────────────────────────
  await db.insert(userEnrolledEvents).values([
    { userId: 'u1', eventId: 'ev1' }, { userId: 'u1', eventId: 'ev2' },
    { userId: 'u2', eventId: 'ev1' }, { userId: 'u2', eventId: 'ev2' },
    { userId: 'u3', eventId: 'ev2' },
    { userId: 'u4', eventId: 'ev1' },
  ]).onConflictDoNothing()

  await db.insert(userActiveChallenges).values([
    { userId: 'u1', challengeId: 'ch1', progress: 60 },
    { userId: 'u1', challengeId: 'ch2', progress: 30 },
    { userId: 'u2', challengeId: 'ch1', progress: 80 },
    { userId: 'u2', challengeId: 'ch2', progress: 45 },
    { userId: 'u3', challengeId: 'ch3', progress: 20 },
    { userId: 'u4', challengeId: 'ch4', progress: 55 },
  ]).onConflictDoNothing()

  console.log('✅ Seed complete')
  process.exit(0)
}

seed().catch((err) => { console.error(err); process.exit(1) })
