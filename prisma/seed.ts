// Phase 1 Day 1 seed script.
//
// Generates two accounts (per DEVELOPMENT.md Day 1 task):
//   1. ADMIN: solo creator (the blog owner)
//   2. USER:  a placeholder friend account used to verify private content
//            visibility flows during future phases.
//
// Credentials default to a deterministic pair so the developer can immediately
// log in without configuring anything. They are clearly flagged in the log
// output and read from env vars when present so production seeds still work.
//
// Hash cost is sourced from @/lib/auth.ts BCRYPT_COST, which is the same value
// login uses; that keeps a single source of truth for how expensive a password
// hash is in this project.

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { BCRYPT_COST } from "../src/lib/auth";

const db = new PrismaClient();

interface SeedAccount {
  email: string;
  username: string;
  displayName: string;
  password: string;
  role: "ADMIN" | "USER";
  envEmail: string;
  envPassword: string;
  envUsername: string;
}

function pick(...values: Array<string | undefined>): string {
  const found = values.find((v) => v && v.trim().length > 0);
  if (!found) throw new Error("missing seed value");
  return found;
}

interface ReadSpec {
  defaultEmail: string;
  defaultUsername: string;
  defaultDisplayName: string;
  defaultPassword: string;
  role: "ADMIN" | "USER";
  envEmail: string;
  envUsername: string;
  envPassword: string;
  envDisplayName: string;
}

function readAccount(spec: ReadSpec): SeedAccount {
  return {
    email: pick(process.env[spec.envEmail], spec.defaultEmail).toLowerCase(),
    username: pick(process.env[spec.envUsername], spec.defaultUsername),
    displayName: pick(process.env[spec.envDisplayName], spec.defaultDisplayName),
    password: pick(process.env[spec.envPassword], spec.defaultPassword),
    role: spec.role,
    envEmail: spec.envEmail,
    envPassword: spec.envPassword,
    envUsername: spec.envUsername,
  };
}

function banner(label: string, account: SeedAccount) {
  const dash = "─".repeat(48);
  const rows = [
    dash,
    "  ⤳ " + label + "  (role: " + account.role + ")",
    "  Email:    " + account.email,
    "  Username: " + account.username,
    "  Password: " + account.password,
    "  env:      " + account.envEmail + " / " + account.envUsername + " / " + account.envPassword,
    dash,
  ];
  return rows.join(String.fromCharCode(10));
}

async function upsertAccount(input: SeedAccount) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  // Idempotent: re-running against an existing DB does not duplicate.
  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: input.email }, { username: input.username }],
    },
  });

  if (existing) {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        role: input.role,
        isActive: true,
      },
      select: { id: true, email: true, role: true },
    });
    console.log("[seed] updated existing user " + updated.email + " (" + updated.role + ")");
    return updated;
  }

  const created = await db.user.create({
    data: {
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });
  console.log("[seed] created user " + created.email + " (" + created.role + ")");
  return created;
}

async function main() {
  const admin = readAccount({
    defaultEmail: "admin@example.com",
    defaultUsername: "admin",
    defaultDisplayName: "小川",
    defaultPassword: "ChangeMe!2026",
    role: "ADMIN",
    envEmail: "SEED_ADMIN_EMAIL",
    envUsername: "SEED_ADMIN_USERNAME",
    envPassword: "SEED_ADMIN_PASSWORD",
    envDisplayName: "SEED_ADMIN_DISPLAY_NAME",
  });

  const friend = readAccount({
    defaultEmail: "friend@example.com",
    defaultUsername: "friend",
    defaultDisplayName: "Test Friend",
    defaultPassword: "Friend!2026",
    role: "USER",
    envEmail: "SEED_FRIEND_EMAIL",
    envUsername: "SEED_FRIEND_USERNAME",
    envPassword: "SEED_FRIEND_PASSWORD",
    envDisplayName: "SEED_FRIEND_DISPLAY_NAME",
  });

  await upsertAccount(admin);
  await upsertAccount(friend);

  if (process.env.NODE_ENV !== "production") {
    console.log("");
    console.log("⚠️  The following default accounts were seeded.");
    console.log("    Change SEED_*_PASSWORD env vars before any non-local use.");
    console.log(banner("ADMIN", admin));
    console.log(banner("USER (friend)", friend));
  }
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
