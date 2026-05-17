# ⚡ Code Dynamos Hub

old website : https://taikyoku.vercel.app/  (conducted an event ,and the student got 1st pllace)

New website created By: **Jayaduran, Sujal Jondhale**
LINK : https://codedynamos-cmru.vercel.app/

Welcome to the **Code Dynamos Hub**—a high-performance, developer-centric community portal engineered for **Web Weave '26**. The hub is a full-stack platform designed to facilitate seamless event coordination, interactive coding challenges, live student performance tracking, project showcases, and a robust administrative control center.

---

## ✨ Core Features

*   🛡️ **Role-Based Authentication & Authorization**
    *   Secure access control using **JWT (JSON Web Tokens)** stored securely client-side.
    *   Granular authorization boundaries ensuring distinct paths and operations for **Admins** and **Members**.
*   📊 **Real-time Gamified Leaderboard**
    *   Aggregates student experience points (XP) based on event participation and challenge completions.
    *   **LeetCode API Sync**: Background cron job automatically synchronizes LeetCode profiles every 48 hours, updating solve counts and contest ratings to dynamically award XP.
*   📅 **Dynamic Event & Sprint Management**
    *   Allows participants to discover and dynamically **RSVP** to upcoming hackathons, tech sprints, and workshops.
    *   Includes explicit administrative closures, countdown states, and platform details.
*   💻 **Admin Control Center**
    *   **Dashboard Aggregates**: Real-time stats counting active students, total XP gained, active challenges, and event completions.
    *   **Member Management**: Dynamic pagination, search/filtering, and capabilities to update XP manually.
    *   **Activity Controls**: Full CRUD operations for both Events and Challenges, along with direct image uploads.
*   📧 **Secure Communications**
    *   Transactional emails using **Resend API** with clean template formatting for password recovery.
    *   Lazy-loading integration ensures the API remains robust, with terminal mock-mail fallbacks in development.
*   🎨 **Premium Aesthetic & UX**
    *   Modern dark-themed palette utilizing the sleek **Geist** typography family.
    *   Smooth micro-interactions and transitions driven by **Framer Motion**.
    *   **Scroll-Reactive Navbar**: Auto-hides when scrolling down to maximize screen real estate and slides back in on scroll-up.

---

## 🛠️ Technology Stack

### Frontend Architecture
*   **Library:** React 19 + TypeScript
*   **Bundler:** Vite 8 (optimized building and rapid hot-module reloading)
*   **Styling:** Tailwind CSS v3/v4 & custom variables
*   **State Management:** TanStack Query v5 (efficient caching, pre-fetching, and background queries)
*   **Routing:** React Router v7 (client-side routing with route-guard layers)

### Backend Architecture
*   **Environment:** Node.js (v18+) with Express.js & TypeScript (`ts-node-dev`)
*   **Database ORM:** Drizzle ORM (type-safe queries, rapid migrations, and schema sync)
*   **Databases:** Designed for PostgreSQL (production instance on Render) and compatible with SQLite (local environments)
*   **Security Headers:** Helmet (configured securely for cross-origin policies) and CORS controls

---

## 📂 Project Structure

```
code-dynamos-sj/
├── src/                        # React Frontend Application
│   ├── assets/                 # Brand assets, SVGs, and illustrations
│   ├── components/
│   │   ├── layouts/            # PublicLayout, AuthLayout, AdminLayout
│   │   └── ui/                 # ProtectedRoute, AdminRoute, CustomCursor, Buttons
│   ├── context/                # AuthContext (state, JWT decoder, login/logout actions)
│   ├── lib/                    # Axios instance with interceptors for auth headers
│   ├── pages/                  # Main pages and admin dashboards
│   │   ├── admin/              # Admin Panel views (Members, Sprints, Events)
│   │   ├── ChallengesPage.tsx  # Coding sprint challenges with dynamic enrollment
│   │   ├── LeaderboardPage.tsx # Dynamic XP rankings with department & year filters
│   │   └── TeamPage.tsx        # Developer directory and profile cards
│   ├── App.tsx                 # Routes config and theme providers
│   └── main.tsx                # Client-side render initiator
│
└── server/                     # Express.js Backend API
    ├── src/
    │   ├── data/               # Static memory datasets and structural models
    │   ├── db/                 # Drizzle schemas, seed configurations, and migrations
    │   │   ├── schema.ts       # Database structures (users, events, challenges, etc.)
    │   │   └── seed.ts         # Initial sample records for bootstrap setup
    │   ├── middleware/         # Auth checkers (authenticate, adminOnly)
    │   ├── routes/             # Segmented router pathways (auth, admin, leaderboard, etc.)
    │   └── index.ts            # Entrypoint (initializes DB auto-migrations, starts server)
    ├── package.json            # Server package settings & scripts
    └── tsconfig.json           # TS Compiler settings for backend
```

---

## ⚙️ Getting Started & Configuration

### Prerequisites
*   **Node.js** (v18.x or higher)
*   **npm** (v9.x or higher)
*   **PostgreSQL Database Instance** (Local server or Cloud Provider like Supabase/Neon/Render)

### 1. Install Project Dependencies

First, download and install dependencies for both the frontend client and the backend server:

```bash
# Install frontend dependencies
npm install

# Navigate to the server directory and install backend dependencies
cd server
npm install
cd ..
```

### 2. Set Up Environment Variables

Create and configure your environment files.

#### Backend Configuration
Create a `.env` file in the `server` directory:
```bash
# server/.env
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/codedynamos
RESEND_API_KEY=your_resend_api_key_here          # Optional: Falls back to mock console logs in dev
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration
Create a `.env` file in the root directory:
```bash
# .env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

### 3. Database Sync & Seeding

Initialize the database schema, migrate, and seed the initial dataset using Drizzle ORM tools within the `server` directory:

```bash
cd server

# Generate Drizzle migration files
npm run db:generate

# Push schema directly to your Database
npm run db:push

# Seed the database with admin and sample member accounts
npm run db:seed

cd ..
```

### 4. Running the Development Servers

Open two parallel terminal sessions to spin up both systems simultaneously:

```bash
# Terminal 1: Backend Server (runs on Port 4000)
cd server
npm run dev

# Terminal 2: Frontend client (runs on Port 5173 with proxy configuration)
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to access the platform.

---

## 👥 Demo Credentials

Utilize the pre-seeded accounts to experience all access tiers:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@codedynamos.io` | `Admin@1234` | Create/edit events, adjust member XP, view metrics |
| **Member** | `arjun@codedynamos.io` | `Member@1234` | RSVP to events, enroll in sprints, sync profile |

---

## 📡 API Architecture

All endpoints are hosted at `/api` and return standard JSON.

### Authentication Path
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register a new developer account |
| `POST` | `/api/auth/login` | Public | Returns authentication JWT token |
| `GET` | `/api/auth/me` | JWT Required | Returns user data from decoded token |
| `POST` | `/api/auth/forgot-password` | Public | Requests verification/reset code |
| `POST` | `/api/auth/reset-password` | Public | Resets password with valid verification token |

### Activities & Leaderboard
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | Fetch all coordinated events |
| `POST` | `/api/events/:id/rsvp` | JWT Required | Register participant for an event |
| `GET` | `/api/challenges` | Public | Fetch all developer sprints |
| `POST` | `/api/challenges/:id/enroll` | JWT Required | Enroll in a developer sprint |
| `GET` | `/api/leaderboard` | Public | Fetch rank standings sorted by season |

### Administrative Controls
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin Only | Fetch aggregate dashboard numbers |
| `GET` | `/api/admin/members` | Admin Only | List all accounts (paginated & searchable) |
| `PATCH` | `/api/admin/members/:id` | Admin Only | Update specific user details, role, or XP |
| `POST` | `/api/admin/events` | Admin Only | Build and catalog a new event |
| `PATCH` | `/api/admin/events/:id` | Admin Only | Update an event (e.g., closures) |
| `POST` | `/api/admin/challenges` | Admin Only | Create a new coding sprint |
| `PATCH` | `/api/admin/challenges/:id` | Admin Only | Modify requirements or end dates |

---

## 🚀 Production Deployment

### Frontend (Vercel)
The client-side is fully optimized for hosting on Vercel. To guarantee React Router works correctly on direct page reloads, a custom [vercel.json](file:///c:/Users/tommy/Downloads/Code-dynamos-SJ/vercel.json) rewrite rule is configured:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Backend (Render)
When deploying the Express backend on platforms like Render, connection timeouts to databases or third-party mailing systems can occur. The system forces Node to prioritize IPv4 configurations (`dns.setDefaultResultOrder('ipv4first')`) at startup, completely eliminating `ENETUNREACH` socket problems when connecting to Render's internal servers and external SMTP servers like `smtp.gmail.com`.

---

*Designed and engineered with passion for Web Weave '26.*
