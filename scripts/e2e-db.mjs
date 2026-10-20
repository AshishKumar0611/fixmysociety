// Prepares a fresh, seeded database used only by the Playwright end-to-end tests.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

for (const f of ["prisma/e2e.db", "prisma/e2e.db-journal"]) rmSync(f, { force: true });
const env = { ...process.env, DATABASE_URL: "file:./e2e.db" };
execSync("npx prisma db push --skip-generate", { env, stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
