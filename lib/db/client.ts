// THE OTHER SIDE - Database Client Architecture (Phase 1 Placeholder)
//
// In subsequent phases, this module will initialize the Prisma client connected
// to PostgreSQL for saving missions, user progression, and world states.
//
// @boundary between #client and #db (#data-boundary) -- "Future PostgreSQL database boundary"
// @owns backend-team for App.Database -- "Database architecture owner"

export interface DatabaseConfig {
  url?: string;
  maxConnections?: number;
}

export const dbStatus = {
  configured: false,
  message: "Phase 1: In-memory presentation mode. PostgreSQL/Prisma slated for Phase 2.",
};
