import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 * In development, Next.js HMR can create many clients; reuse a single instance
 * across hot reloads via globalThis to avoid exhausting database connections.
 *
 * Real query helpers live in src/server/*. Phase 1 will use this client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
