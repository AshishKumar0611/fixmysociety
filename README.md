# FixMySociety

**Your Community. Better Managed.** — *Report it. Track it. Resolve it.*

FixMySociety is a responsive residential maintenance management web application for housing
societies, resident welfare associations (RWAs) and apartment managers in India. Residents report
issues and follow their progress. Society managers triage, assign and resolve complaints, publish
announcements and monitor performance.

> Built as an individual entrepreneurship assignment. All demo people, flats and societies are
> fictional. See [`docs/ASSIGNMENT.md`](docs/ASSIGNMENT.md) for the business write-up and
> presentation script.

## Features

**Residents**
- Dashboard with a personal greeting, live complaint counts, recent complaints and announcements
- Raise a complaint: category, title, description, location, priority, preferred contact and an
  optional photo (JPEG/PNG/WebP, 2 MB), validated in the browser and on the server
- Search, filter (status, category, priority, date), sort and paginate their own complaints
- Complaint detail with a timeline built from real status-history records, plus comments
- Rate a resolution (1–5 stars, once) after it is resolved
- Resolved history, announcements, in-app notifications (mark one or all as read), profile and
  password change

**Managers**
- Operations dashboard: KPIs, resolution rate, average resolution time, resident rating, a priority
  panel, status and category breakdowns, a 30-day volume chart and recent activity
- Complaint queue with search (ID, title, resident, unit), filters, sorting and pagination
- Assign to a manager, update status through a validated workflow, write internal notes
  (manager-only) and public replies, and record a required resolution note
- Analytics for the last 7, 30 or 90 days or a custom range, plus CSV export
- Resident directory with search, filters and account deactivation
- Announcements (schedule, expiry, activate/deactivate, delete)
- Society settings: details, contact, enabled complaint categories, resident join code

**Platform**
- Responsive at 320–1440 px: sidebar (desktop), navigation rail (tablet), drawer plus bottom tab bar
  (mobile)
- Light and dark themes (persisted), keyboard-accessible, visible focus, reduced-motion support
- Secure sessions, role and society-level authorisation on the server, rate-limited login,
  security headers — see [`docs/SECURITY.md`](docs/SECURITY.md)

## Technology

Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 · Prisma 6 (SQLite locally, PostgreSQL in production) · Zod 4 · bcryptjs ·
Recharts 3 · Lucide icons · Vitest · Playwright.

## Getting started (local)

Requirements: Node.js 20.9 or newer (tested on 22), npm.

```bash
git clone https://github.com/AshishKumar0611/fixmysociety.git
cd fixmysociety
npm install
cp .env.example .env          # then set DEMO_MODE="true" if you want one-click demo logins
npm run db:setup              # creates prisma/dev.db and loads the demo data
npm run dev                   # open http://localhost:3000
```

### Demo accounts (local development only)

All seeded accounts use the password **`Demo@2026`** unless `SEED_DEMO_PASSWORD` is set when seeding.

| Role | Email | Notes |
|---|---|---|
| Manager | `manager@greenview.demo` | Priya Menon, Greenview Residency |
| Manager | `facilities@greenview.demo` | Rahul Verma, Greenview Residency |
| Resident | `resident@greenview.demo` | Aarav Sharma, A-101 |
| Resident | `neha.kapoor@greenview.demo` | B-204 (also `rohan.iyer@`, `fatima.khan@`, `vikram.singh@`, `meera.nair@`) |
| Resident (deactivated) | `sanjay.patel@greenview.demo` | cannot sign in |
| Manager / Resident | `manager@lakeside.demo` / `resident@lakeside.demo` | second society, used to show data isolation |

New residents can register at `/register` with the join code **`GREEN2026`**.
With `DEMO_MODE="true"`, the sign-in page also shows **Resident demo** and **Manager demo**
buttons. These are off by default and should stay off in real deployments.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build/serve (SQLite) |
| `npm run build:postgres` | Production build for PostgreSQL (generate, apply pending migrations, build) |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm test` | Vitest unit and integration tests (uses a throwaway `prisma/test.db`) |
| `npm run test:e2e` | Playwright end-to-end tests (builds the app and uses a throwaway `prisma/e2e.db`) |
| `npm run db:setup` · `db:seed` · `db:studio` | Local database helpers |
| `npm run db:reset-demo` | Wipes and reseeds **local** demo data (asks you to type RESET) |
| `npm run db:pg:sync` | Regenerates the PostgreSQL schema from the SQLite schema |

> Playwright uses its own downloaded browser by default (`npx playwright install chromium`).
> To use an existing Chromium instead, set `CHROMIUM_PATH=/path/to/chromium`.

## Testing

Results below are from runs on 20–21 October 2026, in this repository's development environment.

| Suite | Database | Result |
|---|---|---|
| TypeScript (`tsc --noEmit`) and ESLint | — | 0 errors |
| Vitest unit and integration (52 tests) | SQLite | **52 passed** |
| Vitest integration (24 tests) | PostgreSQL 16 | **24 passed** |
| Playwright end-to-end (23 tests, production build) | SQLite | **23 passed** |
| Playwright end-to-end (23 tests, production build) | PostgreSQL 16 | **23 passed** |
| Production build (`next build`) | — | succeeded |

The end-to-end suite covers the whole complaint lifecycle, authentication, role and society
isolation, validation, filters, notifications, announcements, analytics and CSV export, mobile
navigation, dark mode, and checks for horizontal overflow at 375/390/768/1024/1440 px (public
pages also at 320 px; every app page was additionally audited at 320 px with a script). The
full mapping to the specification's 25 test requirements is in
[`docs/ASSIGNMENT.md`](docs/ASSIGNMENT.md#11-testing-methodology).

## Deployment

**Not deployed yet.** The app is ready for Vercel with its built-in Neon PostgreSQL (`vercel.json` included; about 10 minutes of clicks). Follow
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Database details and safe migration steps are in
[`docs/DATABASE.md`](docs/DATABASE.md).

## Project structure

```
prisma/                 schema.prisma (SQLite, source of truth), migrations/, seed.ts
prisma/postgres/        generated PostgreSQL schema + migrations
src/app/                routes: (marketing), (auth), resident/*, manager/*, api/attachments
src/components/         ui/ (design system), app/ (shell, lists, timeline), charts/, complaints/, account/
src/server/services/    business logic and authorisation (testable, no framework code)
src/server/actions/     thin Server Actions: authenticate → validate → call service → revalidate
src/lib/                auth, database client, validation schemas, workflow rules, constants
tests/                  unit/, integration/, e2e/
docs/                   ASSIGNMENT, DATABASE, DEPLOYMENT, SECURITY
```

## Known limitations

No email, SMS or WhatsApp delivery (notifications are in-app only), no password-reset email, and
photos are stored in the database. See [`docs/SECURITY.md`](docs/SECURITY.md#remaining-limitations-honest-list)
and the roadmap in [`docs/ASSIGNMENT.md`](docs/ASSIGNMENT.md).
