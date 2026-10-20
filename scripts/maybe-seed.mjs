// Loads the demo data during a deployment build ONLY when SEED_DEMO_DATA="true".
// The seed is idempotent: existing records are skipped, so repeated deploys never duplicate data.
import { execSync } from "node:child_process";

if (process.env.SEED_DEMO_DATA === "true") {
  console.log("SEED_DEMO_DATA=true: loading demo data (existing records are skipped)…");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
} else {
  console.log("Skipping demo data (set SEED_DEMO_DATA=true to load it).");
}
