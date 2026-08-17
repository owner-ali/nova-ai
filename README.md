# Nova AI

**Your AI assistant that gets things done.**

Nova AI is a full-stack personal AI assistant: a real Next.js application with authentication, a PostgreSQL database, an OpenAI-powered agent that can act on your tasks/reminders/calendar/notes/memory, and a voice interface built on the browser's native speech APIs.

---

## 1. Features

- **Dashboard** — greeting, AI daily briefing, live stats, today's tasks/reminders/calendar, quick actions.
- **AI chat assistant** — persistent conversations, markdown + code rendering, copy/regenerate, search/rename/delete conversations.
- **Voice assistant** — tap-to-talk mic button using the Web Speech API (recognition + synthesis), with idle/listening/thinking/working/done states.
- **Owner command system / AI agent** — natural-language commands are turned into tool calls (create/update/delete tasks, reminders, calendar events, notes, memories, focus sessions) executed **server-side only**, always scoped to the authenticated user. Destructive actions (like deleting a task) require explicit confirmation.
- **Tasks** — full CRUD, priorities, due dates, categories, board view.
- **Reminders** — create via chat/voice or UI, upcoming/overdue/completed views.
- **Calendar** — month view, create/edit/delete events.
- **Notes** — create/edit/pin/search, plus AI summarize / rewrite / extract-tasks.
- **Memory** — durable facts Nova remembers about you, used to personalize every AI response. Fully user-scoped, editable, deletable.
- **Documents** — upload PDF/DOCX/TXT, automatic text extraction + AI summary, ask questions answered from the document's content.
- **Focus mode** — 25/45/60/90-minute countdown sessions, logged to the database.
- **Automations** — trigger → action rules (e.g. "new task created" → "AI generates summary"), with a run history (success/failed).
- **Settings** — profile, AI preferences, voice, notifications, appearance, security (password change), connected apps.
- **Security** — hashed passwords, protected routes via middleware, per-user data isolation enforced in every query, input validation with Zod, basic rate limiting, no secrets in frontend code.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer-Motion-ready components |
| Backend | Next.js Route Handlers (REST API), TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (NextAuth v5) — credentials (bcrypt) + optional Google OAuth |
| AI | OpenAI API (function calling / tools), called only from the server |
| Voice | Browser SpeechRecognition + SpeechSynthesis (swap-in point documented below for Whisper or another STT API) |

---

## 3. Getting started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local, Docker, or a hosted instance like Neon/Supabase/RDS)
- An OpenAI API key

### Install

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nova_ai?schema=public"
AUTH_SECRET="generate with: npx auth secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""        # optional
GOOGLE_CLIENT_SECRET=""    # optional
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
```

Never commit `.env` — it's already in `.gitignore`.

### Database setup

```bash
npx prisma generate
npm run db:push        # create tables from prisma/schema.prisma
npm run db:seed        # optional: demo user + demo data
```

Demo login after seeding: `ali@example.com` / `password123`.

For production, prefer migrations over `db:push`:

```bash
npm run db:migrate      # creates a migration during development
npx prisma migrate deploy  # applies migrations in production
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Production build

```bash
npm run build
npm start
```

---

## 4. AI configuration

- All OpenAI calls happen in server-only modules (`src/lib/openai.ts`, `src/lib/agent/*`) — the API key is **never** sent to the browser.
- The agent's available tools are defined in `src/lib/agent/tools.ts` and executed in `src/lib/agent/executor.ts`. Every tool call is scoped to `userId` and destructive tools (currently `deleteTask`) require a client-confirmed flag before they run.
- To add a new tool: add its schema to `AGENT_TOOLS`, implement it in `executeTool`, and (if destructive) add its name to `DESTRUCTIVE_TOOLS`.
- Change the model via `OPENAI_MODEL` in `.env` (defaults to `gpt-4o`).

## 5. Voice requirements

- Voice recognition/synthesis use the browser's native `SpeechRecognition` / `speechSynthesis` APIs — no extra setup needed, but they currently work best in Chrome/Edge (desktop and Android). Safari/iOS support varies.
- Microphone permission is requested by the browser the first time the mic button is used; a friendly fallback message is shown if the API isn't available.
- **To swap in Whisper (or another STT API) later:** replace the `SpeechRecognition` usage in `src/components/assistant/voice-button.tsx` with an audio-recording flow that posts the recorded blob to a new `/api/ai/transcribe` route, which calls OpenAI's Whisper endpoint server-side and returns text. The rest of the pipeline (`onCommand` → `/api/ai/command` → agent) stays the same.

## 6. Deployment

Nova AI deploys cleanly to any Node.js host that supports Next.js (Vercel, Render, Fly.io, a VPS with PM2, etc.):

1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Set `AUTH_SECRET`, `NEXTAUTH_URL` (your production URL), `OPENAI_API_KEY`, and optionally the Google OAuth variables in your host's environment settings.
3. Run `npx prisma migrate deploy` as part of your deploy step.
4. `npm run build && npm start` (or let your platform run these for you).
5. Uploaded documents are stored under `public/uploads/<userId>/` in this reference implementation — for production, swap `src/app/api/documents/upload/route.ts` to write to S3/GCS/Cloud Storage instead of the local filesystem, since most hosts have ephemeral disks.

## 7. Project structure

```
nova-ai/
├── prisma/
│   ├── schema.prisma       # all data models
│   └── seed.ts             # demo data
├── src/
│   ├── app/
│   │   ├── (app)/          # protected pages: dashboard, assistant, tasks, calendar, notes, memories, documents, automations, focus, settings
│   │   ├── api/            # REST route handlers
│   │   ├── login/ register/
│   │   └── page.tsx        # landing page
│   ├── components/         # UI, grouped by feature
│   ├── lib/
│   │   ├── agent/          # tools.ts, executor.ts, agent.ts — the AI agent
│   │   ├── auth.ts         # Auth.js config
│   │   ├── openai.ts       # server-only OpenAI client
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── automations.ts  # trigger → action runner
│   │   └── rate-limit.ts
│   └── middleware.ts       # route protection
└── .env.example
```

## 8. Notes on scope

This is a working reference implementation intended as a strong, honest starting point rather than a finished commercial product — a few things worth knowing before you ship it:

- The rate limiter is in-memory (per server instance). Swap for Redis in a multi-instance deployment.
- Document storage uses the local filesystem for simplicity; use object storage in production.
- Google Calendar sync is not implemented — the `CalendarEvent` model and API are structured so it can be added by writing a sync job that reads/writes through the same endpoints.
- Browser notifications for due reminders are a good next addition (Notification API + a client-side poller or Server-Sent Events).
