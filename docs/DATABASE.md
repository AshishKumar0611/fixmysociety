# Database guide

FixMySociety uses **Prisma 6** with two database providers:

| Environment | Provider | Schema file | Migrations |
|---|---|---|---|
| Local development and tests | SQLite (a file, no server needed) | `prisma/schema.prisma` | `prisma/migrations/` |
| Production | PostgreSQL | `prisma/postgres/schema.prisma` (generated) | `prisma/postgres/migrations/` |

## Why two schema files?

Prisma does not allow the `provider` to come from an environment variable, and migration SQL is
provider-specific (SQLite and PostgreSQL use different column types, enum handling, etc.).
Changing only the connection string is therefore **not** enough to move between them.

To keep one source of truth:

1. `prisma/schema.prisma` (SQLite) is the file you edit.
2. `npm run db:pg:sync` copies it to `prisma/postgres/schema.prisma`, changing only the provider.
3. Each provider keeps its own migration history.

The model uses only features that behave the same on both providers:

- Enums (supported by Prisma on SQLite since 6.2; native `ENUM` types on PostgreSQL).
- `Bytes` for photo uploads (`BLOB` on SQLite, `BYTEA` on PostgreSQL).
- No provider-specific `@db.*` native types.
- **Priority sorting** uses a numeric `priorityRank` column, because SQLite stores enums as text
  (alphabetical sorting) while PostgreSQL sorts enums by declaration order.
- **Case-insensitive search** goes through `containsInsensitive()` in `src/lib/db.ts`, which adds
  `mode: "insensitive"` on PostgreSQL. (SQLite `LIKE` is already case-insensitive for ASCII.)

## Data model

```
Society 1─* User (RESIDENT | MANAGER)
Society 1─* Complaint *─1 User (resident)
                 │    *─0..1 User (assigned manager)
                 ├─* ComplaintStatusHistory (every status change, who and when)
                 ├─* ComplaintComment (isInternal = manager-only notes)
                 ├─* ComplaintAttachment (validated image bytes)
                 ├─0..1 Feedback (one rating per complaint)
                 └─* Notification
Society 1─* Announcement
User 1─* Session (hashed tokens) · LoginAttempt (rate limiting)
```

Key constraints: unique `User.email`, unique `Complaint.complaintNumber`, unique
`Feedback.complaintId` (one rating per complaint), unique `(residentId, submissionKey)` to stop
double submissions, unique `Session.tokenHash`, and indexes on the common query paths
(society + status, society + created date, resident + created date, recipient + read state).

Complaint numbers are `<SOCIETY CODE>-<sequence>` (for example `GVR-1015`). The sequence is
incremented inside the same transaction that creates the complaint.

## Local development

```bash
npm run db:setup        # apply migrations to prisma/dev.db and seed demo data
npm run db:seed         # re-run the seed (safe: it skips existing records)
npm run db:reset-demo   # wipe LOCAL data and reseed (asks you to type RESET)
npm run db:studio       # browse the data
```

### Changing the schema

```bash
# 1. Edit prisma/schema.prisma
npx prisma migrate dev --name describe_change     # SQLite migration + client
# 2. Keep the PostgreSQL schema in sync
npm run db:pg:sync
# 3. Create the matching PostgreSQL migration (needs an EMPTY scratch PostgreSQL database,
#    never production — Prisma uses it to compute the diff)
SHADOW=postgresql://user:pass@localhost:5432/fms_shadow
npx prisma migrate diff \
  --from-migrations prisma/postgres/migrations \
  --to-schema-datamodel prisma/postgres/schema.prisma \
  --shadow-database-url "$SHADOW" \
  --script > prisma/postgres/migrations/$(date +%Y%m%d%H%M%S)_describe_change/migration.sql
# 4. Read the generated SQL. Look for DROP TABLE / DROP COLUMN / ALTER TYPE before committing.
```

## Production (PostgreSQL)

1. Create an empty PostgreSQL database (for example a free Neon, Supabase or Vercel Postgres
   instance) and copy its **direct** (non-pooled) connection string.
2. Set `DATABASE_URL` to that string in your hosting provider's environment variables.
3. Build with `npm run build:postgres`. This runs:
   - `prisma generate --schema prisma/postgres/schema.prisma`
   - `prisma migrate deploy --schema prisma/postgres/schema.prisma`, which **only applies migrations
     that have not run yet**. It never resets the database or regenerates history.
   - `next build`
4. Optionally load the demo data **once** (from your own computer):

   ```bash
   npx prisma generate --schema prisma/postgres/schema.prisma
   DATABASE_URL="postgresql://…" NODE_ENV=production SEED_DEMO_PASSWORD="choose-a-strong-one" npx tsx prisma/seed.ts
   npx prisma generate   # switch your local client back to SQLite
   ```

### Safety rules

- Never run `prisma migrate dev`, `prisma migrate reset` or `prisma db push --force-reset`
  against a production database. They can drop data.
- Review every PostgreSQL migration before deploying, and back up the database before applying
  one that drops or changes columns.
- `npm run db:reset-demo` refuses to run unless `DATABASE_URL` is a local `file:` SQLite database.

## Verification performed

The generated PostgreSQL migration was applied to a fresh local PostgreSQL 16 database with
`prisma migrate deploy`, seeded, and queried (including case-insensitive search) during
development. See the testing section of the README for the outcomes.
