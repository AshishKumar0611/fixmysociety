import path from "node:path";
import { defineConfig } from "vitest/config";

// Set TEST_DATABASE_URL to run the integration tests against an already-migrated, seeded,
// DISPOSABLE PostgreSQL database instead of the default throwaway SQLite file.
const externalDb = process.env.TEST_DATABASE_URL;

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Integration tests use their own throwaway SQLite database, never the dev database.
    env: { DATABASE_URL: externalDb ?? "file:./test.db", NODE_ENV: "test" },
    globalSetup: externalDb ? [] : ["tests/integration/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
