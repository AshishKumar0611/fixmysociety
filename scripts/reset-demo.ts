/**
 * Resets LOCAL demo data: deletes every row and re-runs the seed.
 *
 *   npm run db:reset-demo            (asks you to type RESET)
 *   npm run db:reset-demo -- --yes   (skips the prompt, for scripts)
 *
 * Safety: refuses to run in production or against anything other than a local SQLite file.
 */
import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || !url.startsWith("file:")) {
  console.error("Refusing to reset: this command only works on a local SQLite database (DATABASE_URL=file:...).");
  process.exit(1);
}

async function main() {
  if (!process.argv.includes("--yes")) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`This deletes ALL data in ${url} and reloads the demo data. Type RESET to continue: `);
    rl.close();
    if (answer.trim() !== "RESET") {
      console.log("Cancelled. Nothing was changed.");
      return;
    }
  }
  const prisma = new PrismaClient();
  // Children first, then parents.
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.complaintComment.deleteMany(),
    prisma.complaintStatusHistory.deleteMany(),
    prisma.complaintAttachment.deleteMany(),
    prisma.complaint.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.session.deleteMany(),
    prisma.loginAttempt.deleteMany(),
    prisma.user.deleteMany(),
    prisma.society.deleteMany(),
  ]);
  await prisma.$disconnect();
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
