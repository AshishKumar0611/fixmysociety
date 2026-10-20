# Deployment guide

> **Status:** FixMySociety has **not** been deployed publicly yet. The steps below take about
> 15 minutes and use free tiers. Both services ask you to create an account.

## Option A — Vercel + Neon PostgreSQL (recommended, free tiers)

SQLite cannot be used on Vercel, because serverless functions have a read-only, temporary file
system. Production therefore uses PostgreSQL.

### 1. Create the database (Neon)

1. Sign in at <https://neon.tech> and create a project (choose a region close to India,
   for example Singapore `aws-ap-southeast-1`).
2. Open **Connection details**, turn **off** "Connection pooling", and copy the connection string.
   It looks like `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
   Keep it secret.

### 2. Import the project into Vercel

1. Sign in at <https://vercel.com> with GitHub and choose **Add New → Project →
   `AshishKumar0611/fixmysociety`**.
2. Framework preset: **Next.js** (auto-detected).
3. **Build Command:** override it to `npm run build:postgres`.
4. **Environment Variables:**

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string |
   | `DEMO_MODE` | `true` only if you want one-click demo logins for assessors (see warning below); otherwise `false` |
   | `SEED_DEMO_PASSWORD` | a strong password for the demo accounts (only used when you seed) |

5. Click **Deploy**. The build creates the tables with `prisma migrate deploy`, which only applies
   pending migrations and never wipes data.

### 3. Load the demo data (once, from your computer)

```bash
git clone https://github.com/AshishKumar0611/fixmysociety && cd fixmysociety && npm install
npx prisma generate --schema prisma/postgres/schema.prisma
DATABASE_URL="<neon connection string>" NODE_ENV=production SEED_DEMO_PASSWORD="<same password>" npx tsx prisma/seed.ts
npx prisma generate     # switch your local Prisma client back to SQLite
```

The seed is safe to re-run: it skips records that already exist.

### 4. Check the deployment

- Open the Vercel URL. The landing page should load.
- Sign in as `manager@greenview.demo` with your `SEED_DEMO_PASSWORD`, or use the demo buttons if
  `DEMO_MODE=true`.
- Raise a complaint as `resident@greenview.demo` and resolve it as the manager.

> ⚠️ **Demo mode warning.** With `DEMO_MODE=true`, anyone with the link can open the fictional
> manager account and change demo data. That is fine for an assignment demo with fictional data, but
> turn it off (`false`) and redeploy for any real use.

## Option B — any Node.js host (Render, Railway, a VPS)

```bash
npm ci
npm run build:postgres      # with DATABASE_URL set to PostgreSQL
npm start                   # serves on port 3000 (set PORT to change)
```

Run behind HTTPS. Cookies are marked `Secure` when `NODE_ENV=production`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` locally; a PostgreSQL URL in production |
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
