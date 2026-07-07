# AI Internal Helpdesk

A scalable multi-tenant SaaS platform for AI-powered internal support. Companies upload internal documents (HR policies, IT guides, SOPs, FAQs) and employees get instant answers via an AI chatbot. Unresolved questions route to support tickets for HR, IT, Admin, or Finance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL with pgvector |
| Auth | JWT with role-based access control |

## Project Structure

```
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── docker-compose.ym
└── package.json      # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local via Homebrew) **or** Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Set up persistent local database

**Option A — Homebrew (recommended on Mac):**

```bash
brew install postgresql@16
brew services start postgresql@16
npm run db:setup
```

This creates a permanent `helpdesk` database. **Dat survives page refreshes and server restarts.**

**Option B — Docker:**

```bash
docker compose up -d
npm run db:push
```

### 3. Configure environment

Backend (`apps/api/.env`):
```
DATABASE_URL="postgresql://helpdesk:helpdesk@localhost:5432/helpdesk?schema=public"
JWT_SECRET="your-secure-secret"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

Frontend (`apps/web/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Start development servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api

## MVP Features

### Authentication
- Company registration with admin user
- Login with company slug
- User invitations
- Forgot password flow
- Role-based access (Super Admin, Company Admin, Manager, Agent, Employee)

### Knowledge Base
- Document upload (TXT, MD, PDF, JSON)
- Automatic text parsing and chunking
- pgvector-ready embedding column
- Document list with status tracking

### AI Chat
- Question answering from company documents
- Source references
- Chat history
- Ticket suggestion when no answer found

### Ticketing
- Create tickets manually or from chat
- Categories: HR, IT, Admin, Finance
- Priority and status management
- Comments and activity history

### Dashboard
- Key metrics and recent activity
- Most asked topics by category
a
### Integrations (Placeholder)
- Architecture ready for Slack, Teams, Google Drive, Jira, ServiceNow, Workday, and more

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/invite` |
| Companies | `GET /companies/me`, `PATCH /companies/me` |
| Users | `GET /users`, `GET /users/:id`, `PATCH /users/:id` |
| Departments | `GET /departments`, `POST /departments`, `PATCH /departments/:id` |
| Knowledge Base | `GET /knowledge-base`, `POST /knowledge-base/upload`, `DELETE /knowledge-base/:id` |
| Chat | `GET /chat/sessions`, `POST /chat/messages` |
| Tickets | `GET /tickets`, `POST /tickets`, `PATCH /tickets/:id`, `POST /tickets/:id/comments` |
| Dashboard | `GET /dashboard/stats` |
| Integrations | `GET /integrations`, `POST /integrations/:provider/connect` |

## Scripts

```bash
npm run dev          # Start both frontend and backend
npm run dev:api      # Backend only
npm run dev:web      # Frontend only
npm run build        # Build both apps
npm run db:generate  # Generate Prisma client
npm run db:setup     # Create local PostgreSQL DB (first time)
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

### Database persistence

| Storage | Persists after refresh? | Persists after restart? |
|---------|----------------------|-------------------------|
| Homebrew PostgreSQL (`npm run db:setup`) | Yes | Yes |
| Docker (`docker compose up -d`) | Yes | Yes |
| Prisma dev (`npx prisma dev`) | Yes | No (temporary) |

Login state is stored in browser `localStorage` and survives page refresh.
Chat history is stored in PostgreSQL and reloads when you open the chat page.
