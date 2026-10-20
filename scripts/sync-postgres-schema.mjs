// Generates prisma/postgres/schema.prisma (production, PostgreSQL) from prisma/schema.prisma
// (local development, SQLite) so both always describe the same data model.
//
// Usage: npm run db:pg:sync
// Then create a PostgreSQL migration for any schema change — see docs/DATABASE.md.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("prisma/schema.prisma", "utf8");
if (!/provider\s*=\s*"sqlite"/.test(source)) {
  console.error('Expected provider = "sqlite" in prisma/schema.prisma');
  process.exit(1);
}

const header = `// GENERATED FILE — do not edit by hand.
// Source: prisma/schema.prisma. Regenerate with \`npm run db:pg:sync\`.
// This schema targets PostgreSQL for production deployments.

`;
const body = source
  .replace(/^\/\/ FixMySociety database schema\.[\s\S]*?\n\n/, "")
  .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
  // Migrations need a direct (non-pooled) connection; the app itself can use a pooled one.
  // Vercel's Neon integration sets both variables automatically. Elsewhere, set both to the same URL.
  .replace(/(url\s*=\s*env\("DATABASE_URL"\)\n)/, '$1  directUrl = env("DATABASE_URL_UNPOOLED")\n');

mkdirSync("prisma/postgres", { recursive: true });
writeFileSync("prisma/postgres/schema.prisma", header + body);
console.log("Wrote prisma/postgres/schema.prisma");
