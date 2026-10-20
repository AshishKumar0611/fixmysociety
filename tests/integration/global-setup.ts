import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

// Hard-coded throwaway database used ONLY by tests (never the dev or production database).
const TEST_DB_FILE = path.resolve(__dirname, "../../prisma/test.db");

/** Creates a fresh, seeded test database before the run. */
export default function setup() {
  rmSync(TEST_DB_FILE, { force: true });
  rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  const env = { ...process.env, DATABASE_URL: "file:./test.db", NODE_ENV: "test" as const };
  execSync("npx prisma db push --skip-generate", { env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
}
