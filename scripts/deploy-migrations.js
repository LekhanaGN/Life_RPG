// scripts/deploy-migrations.js
// Safe, automated execution of Prisma migrations in CI / Vercel deployment pipelines
const { execSync } = require("child_process");

function deployMigrations() {
  console.log("[Prisma Migration Deploy] Starting production migration check...");

  try {
    // Run prisma migrate deploy
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("[Prisma Migration Deploy] Migrations successfully checked and applied.");
  } catch (error) {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      console.error("[Prisma Migration Deploy ERROR]: Migration failed in production environment:", error);
      process.exit(1);
    } else {
      console.warn(
        "[Prisma Migration Deploy NOTICE]: Local database connection unavailable. Skipping migration for local environment build."
      );
    }
  }
}

deployMigrations();
