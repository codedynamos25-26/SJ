# Code Dynamos

**Live:** [https://taikyoku.vercel.app](https://taikyoku.vercel.app)

Official platform for **Code Dynamos** — a developer community hub built for Web Weave '26. Features event management, coding sprints, member profiles, leaderboard, project showcases, and a full admin panel.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + custom design system |
| State | TanStack Query v5 + React Context |
| Routing | React Router v6 |
| Backend | Express.js + TypeScript (`ts-node-dev`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Animations | Framer Motion |
| Fonts | Geist (sans + mono) |

## Project Structure

```
├── src/                        # React frontend
│   ├── pages/                  # 11 pages (Home, Events, Challenges, Gallery, etc.)
│   │   └── admin/              # Admin dashboard
│   ├── components/
│   │   ├── layouts/            # PublicLayout, AuthLayout
│   │   └── ui/                 # ProtectedRoute, AdminRoute, CustomCursor
│   ├── context/                # AuthContext (JWT + localStorage persistence)
│   └── lib/                    # Axios instance with interceptors
│
└── server/                     # Express API
    └── src/
        ├── data/               # In-memory mock data (users, events, challenges, etc.)
        ├── middleware/         # auth.ts (authenticate, adminOnly)
        ├── routes/             # auth, events, challenges, dashboard, admin
        └── index.ts            # App entry point (port 4000)
```

## Pages

- `/` — Home (hero, stats, featured events & challenges)
- `/events` — Event queue with RSVP
- `/challenges` — Coding sprints with enrollment
- `/projects` — Project showcase
- `/team` — Team members
- `/leaderboard` — XP rankings by season
- `/gallery` — Photo gallery
- `/login` & `/signup` — Auth
- `/dashboard` — Member dashboard (protected)
- `/admin` — Admin panel (admin-only)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env and set JWT_SECRET
```

Or create `server/.env` manually:

```
PORT=4000
JWT_SECRET=your_secret_here
```

### 3. Run in development

Open two terminals:

```bash
# Terminal 1 — Backend (port 4000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so no CORS config is needed.

Open [http://localhost:5173](http://localhost:5173).

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@codedynamos.io` | `Admin@1234` |
| Member | `arjun@codedynamos.io` | `Member@1234` |

## API Overview

All routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | — | Login, returns JWT |
| POST | `/auth/signup` | — | Register new member |
| GET | `/auth/me` | JWT | Get current user |
| GET | `/events` | — | List all events |
| POST | `/events/:id/rsvp` | JWT | RSVP to an event |
| GET | `/challenges` | — | List all challenges |
| POST | `/challenges/:id/enroll` | JWT | Enroll in a challenge |
| GET | `/dashboard` | JWT | Member dashboard data |
| GET | `/admin/stats` | Admin | Aggregate stats |
| GET | `/admin/members` | Admin | All members |
| PATCH | `/admin/members/:id/role` | Admin | Promote/demote member |
| GET/POST | `/admin/events` | Admin | List / create events |
| PATCH/DELETE | `/admin/events/:id` | Admin | Update / delete event |
| GET/POST | `/admin/challenges` | Admin | List / create challenges |
| PATCH/DELETE | `/admin/challenges/:id` | Admin | Update / delete challenge |

## Build for Production

```bash
# Frontend
npm run build        # outputs to dist/

# Backend
cd server && npm run build   # outputs to server/dist/
cd server && npm start
```

## Adding Google OAuth (Future)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google+ API** and create OAuth 2.0 credentials
3. Add `http://localhost:4000/api/auth/google/callback` as an authorized redirect URI
4. Install `passport`, `passport-google-oauth20`, and `express-session` in the server
5. Add a `googleId` field to the `User` type and update the users data store
6. Create `GET /api/auth/google` and `GET /api/auth/google/callback` routes
7. On successful OAuth, sign a JWT the same way as `/auth/login` and redirect to the frontend with the token

---

Built for Web Weave '26.
