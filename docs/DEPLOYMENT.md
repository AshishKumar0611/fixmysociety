# Deployment guide

> **Status:** FixMySociety has **not** been deployed publicly yet. The steps below take about
> 10 minutes, use free tiers, and need only a Vercel account (sign in with GitHub).
> The exact build command below was rehearsed against a fresh PostgreSQL 16 database: migrations
> applied, demo data loaded, a second build skipped existing data, and all 23 end-to-end tests passed.

## Option A — Vercel with its built-in Neon PostgreSQL (recommended, free tiers, no terminal)

SQLite cannot be used on Vercel, because serverless functions have a read-only, temporary file
system. Production therefore uses PostgreSQL. Vercel can create a Neon database for you and
connect it automatically.

The repository already contains `vercel.json`, which sets the build command to
`npm run build:postgres` (generate the Prisma client → apply pending migrations → optionally load
demo data → `next build`). You don't need to change any build settings.

### 1. Import the project

1. Go to <https://vercel.com/signup> and choose **Continue with GitHub** (sign in as AshishKumar0611).
   Pick the free **Hobby** plan.
2. Click **Add New… → Project**. If `fixmysociety` isn't listed, click **Adjust GitHub App
   Permissions** and give Vercel access to that repository.
3. Click **Import** next to `fixmysociety`, then **Deploy**.
   *This first deployment is expected to fail with a database error, because there is no database
   yet. That's fine.*

### 2. Add the database

1. In the project, open the **Storage** tab → **Create Database** → choose **Neon** (Serverless
   Postgres) → accept the free plan → pick the **Singapore** region (closest to India) → **Create**.
2. When asked, connect it to the `fixmysociety` project for **all environments**. Vercel then adds
   `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (and others) automatically. You never need to copy a
   database password.

### 3. Add three settings

Open **Settings → Environment Variables** and add:

| Name | Value | Why |
|---|---|---|
| `SEED_DEMO_DATA` | `true` | Loads the fictional Greenview Residency demo data during the build (safe on every deploy: existing records are skipped) |
| `SEED_DEMO_PASSWORD` | a password you choose, e.g. 12+ characters | Password for all demo accounts |
| `DEMO_MODE` | `true` for an assessor-friendly demo, otherwise `false` | Shows the one-click Resident/Manager demo buttons (see warning below) |

### 4. Deploy again

Open **Deployments**, click **⋯** on the latest deployment → **Redeploy**. When it shows **Ready**,
click **Visit**. Your URL looks like `https://fixmysociety-xxxx.vercel.app`.

### 5. Check it

- Sign in as `manager@greenview.demo` with your `SEED_DEMO_PASSWORD`, or use the demo buttons.
- Raise a complaint as `resident@greenview.demo` and resolve it as the manager.
- Optional: once the data is loaded, set `SEED_DEMO_DATA` to `false`. Leaving it `true` is also safe.

> ⚠️ **Demo mode warning.** With `DEMO_MODE=true`, anyone with the link can open the fictional
> manager account and change demo data. That is fine for an assignment demo with fictional data, but
> set it to `false` (and redeploy) for any real use.

### Troubleshooting

- **"Environment variable not found: DATABASE_URL"** — the Neon database is not connected to this
  project or environment (step 2). Connect it, then redeploy.
- **"Environment variable not found: DATABASE_URL_UNPOOLED"** — you used a database other than
  Vercel's Neon integration. Add `DATABASE_URL_UNPOOLED` with your direct (non-pooled) connection
  string. It can be the same value as `DATABASE_URL`.
- **"Refusing to seed in production without SEED_DEMO_PASSWORD set"** — add `SEED_DEMO_PASSWORD`
  (step 3), or set `SEED_DEMO_DATA=false`.

## Option B — any Node.js host (Render, Railway, a VPS)

```bash
npm ci
npm run build:postgres      # with DATABASE_URL and DATABASE_URL_UNPOOLED set (can be the same URL)
npm start                   # serves on port 3000 (set PORT to change)
```

Run behind HTTPS. Cookies are marked `Secure` when `NODE_ENV=production`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` locally; a PostgreSQL URL in production (pooled is fine) |
| `DATABASE_URL_UNPOOLED` | production | direct (non-pooled) PostgreSQL URL used for migrations; set automatically by Vercel's Neon integration |
| `SEED_DEMO_DATA` | no (default off) | `"true"` loads demo data during `build:postgres` (idempotent) |
| `DEMO_MODE` | no (default `false`) | `"true"` enables the one-click demo sign-in buttons |
| `SEED_DEMO_PASSWORD` | when seeding in production | password for every seeded demo account (local default `Demo@2026`) |

No other secrets are needed. Session tokens are random values whose hashes are stored in the
database.

## Updating a deployment

Push to the `main` branch and Vercel redeploys automatically. If you changed the schema, create
and review the PostgreSQL migration first (see `docs/DATABASE.md`) and back up the database before
deploying a migration that drops or alters columns.

## Costs

Neon's and Vercel's hobby tiers are free for this workload at the time of writing. Check their
current pricing pages, because limits change. Nothing in this project needs a paid plan.
