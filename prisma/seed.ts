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

async function seedTechnicalContent(authorId: string) {
  const backend = await db.column.upsert({
    where: { slug: "backend-engineering" },
    update: { name: "后端工程", description: "服务端架构、数据与工程实践。", order: 0, parentId: null },
    create: { name: "后端工程", slug: "backend-engineering", description: "服务端架构、数据与工程实践。", order: 0 },
  });
  const frontend = await db.column.upsert({
    where: { slug: "frontend-engineering" },
    update: { name: "前端工程", description: "现代 Web 开发与交互实现。", order: 1, parentId: null },
    create: { name: "前端工程", slug: "frontend-engineering", description: "现代 Web 开发与交互实现。", order: 1 },
  });
  const spring = await db.column.upsert({
    where: { slug: "spring-boot" },
    update: { name: "Spring Boot", description: "Spring Boot 实战与源码笔记。", order: 0, parentId: backend.id },
    create: { name: "Spring Boot", slug: "spring-boot", description: "Spring Boot 实战与源码笔记。", order: 0, parentId: backend.id },
  });
  const database = await db.column.upsert({
    where: { slug: "database" },
    update: { name: "数据库", description: "MySQL、Redis 与数据建模。", order: 1, parentId: backend.id },
    create: { name: "数据库", slug: "database", description: "MySQL、Redis 与数据建模。", order: 1, parentId: backend.id },
  });

  const tag = await db.tag.upsert({
    where: { slug: "engineering" },
    update: { name: "工程实践" },
    create: { name: "工程实践", slug: "engineering", color: "#E85A2C" },
  });

  const samples = [
    {
      slug: "spring-boot-error-handling",
      title: "Spring Boot 统一异常处理的边界",
      excerpt: "从控制器异常到领域错误，整理一套不泄漏实现细节的响应策略。",
      columnId: spring.id,
      coverImage: "/uploads/2026-07/037f7b395576252684a2.jpg",
    },
    {
      slug: "database-index-review",
      title: "一次索引失效问题的排查记录",
      excerpt: "从慢查询日志出发，复盘联合索引、隐式转换与执行计划之间的关系。",
      columnId: database.id,
      coverImage: "/uploads/2026-07/49eed75646b9f63fc18c.jpg",
    },
    {
      slug: "backend-project-checklist",
      title: "后端项目上线前的检查清单",
      excerpt: "把配置、日志、监控、回滚和数据备份整理成一份可复用清单。",
      columnId: backend.id,
      coverImage: "/uploads/2026-07/474100ba4f0b7f304f95.png",
    },
    {
      slug: "learning-notes-method",
      title: "如何整理一篇可复用的技术笔记",
      excerpt: "技术写作不只是记录结论，还要保留问题、约束与验证过程。",
      columnId: null,
      coverImage: "/uploads/2026-07/ce2ba9886d978e9eac9f.jpg",
    },
  ];

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const publishedAt = new Date(Date.now() - index * 86_400_000);
    await db.article.upsert({
      where: { slug: sample.slug },
      update: {
        title: sample.title,
        excerpt: sample.excerpt,
        content: `# ${sample.title}\n\n${sample.excerpt}\n\n这是本地开发使用的示例文章，可以在后台直接修改或删除。`,
        columnId: sample.columnId,
        coverImage: sample.coverImage,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt,
      },
      create: {
        slug: sample.slug,
        title: sample.title,
        excerpt: sample.excerpt,
        content: `# ${sample.title}\n\n${sample.excerpt}\n\n这是本地开发使用的示例文章，可以在后台直接修改或删除。`,
        columnId: sample.columnId,
        coverImage: sample.coverImage,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        publishedAt,
        authorId,
        tags: { create: { tagId: tag.id } },
      },
    });
  }

  void frontend;
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

  const adminRow = await upsertAccount(admin);
  await upsertAccount(friend);
  await seedTechnicalContent(adminRow.id);

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
