# Nook

A cozy, cloud-synced productivity dashboard. Nook helps you keep track of your
day with tasks, categories, projects, subtasks, and a calm dark interface —
all synced to your own Supabase backend and secured with row-level security.

## Features

- **Today, Upcoming, All Tasks, Completed** views with live counts.
- **Categories** for grouping tasks (e.g. Work, University, Personal).
- **Projects & Classes** to track longer-running work, optionally filed under a
  category.
- **Subtasks** inside any task.
- **Priorities** — low, normal, high, urgent — with overdue and due-today
  highlighting.
- **Themes & accent colours** you can preview live and save to your profile.
- **Authentication** via Supabase (email + password), with per-user data
  isolation enforced by RLS.
- Cozy dark UI built with Tailwind v4.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Cache Components)
- React 19
- TypeScript
- Tailwind CSS v4
- [Supabase](https://supabase.com) (Postgres + Auth)
- `lucide-react` icons

## Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project (free tier is fine) — see below

## 1. Clone and install

```bash
git clone https://github.com/Emmett1027/nook.git
cd nook
npm install
```

## 2. Create a Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API**, note:
   - the **Project URL**
   - the **Publishable key** (older projects label this the `anon` key)

## 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

`.env.local` is gitignored — never commit real keys.

## 4. Set up the database

Nook expects the following tables in your Supabase schema, each with a
`user_id` column and RLS policies restricting rows to the owning user:

- `profiles`
- `categories`
- `projects`
- `tasks` (including `is_completed`, `due_at`, and a `priority` of
  `low | normal | high | urgent`)
- `subtasks`

Create these tables and their RLS policies in the Supabase **SQL Editor** before
signing in.

To keep `updated_at` accurate on every write, run the optional trigger
migration once:

```text
supabase/migrations/0001_set_updated_at.sql
```

(The app also sets `updated_at` in every update, so it works without this.)

### Email confirmation

By default Supabase asks new users to confirm their email. For the smoothest
first run, either:

- disable confirmation under **Authentication → Providers → Email**, or
- keep it on and click the confirmation link after signing up.

## 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and
start adding tasks.

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## Deploying

Deploy on [Vercel](https://vercel.com/new): import the repo, add the two
`NEXT_PUBLIC_SUPABASE_*` environment variables, and deploy. Any host that runs
Next.js works too.

## License

MIT — do whatever makes your nook cozy.
