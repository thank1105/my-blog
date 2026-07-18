// Server-side user CRUD.
//
// Phase 1 / Day 2 scope (DEVELOPMENT.md Day 2 task list):
//   * list users
//   * create user
//   * update user (display name, role, isActive)
//   * disable / enable account
//   * reset password
//
// All write operations go through these helpers so the inputs can be
// validated once and reused across server actions / route handlers. They
// do NOT enforce the ADMIN role -- the caller is responsible for that
// (middleware + per-action checks). Splitting the "who can do this" from
// the "what changes does this make" lets us reuse these primitives in
// the future seed CLI without re-implementing validation.

import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";

import { BCRYPT_COST } from "@/lib/auth";
import { db } from "@/lib/db";

export interface ListUsersOptions {
  take?: number;
  skip?: number;
  includeDisabled?: boolean;
}

export async function listUsers(opts: ListUsersOptions = {}) {
  const { take = 50, skip = 0, includeDisabled = true } = opts;
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
    where: includeDisabled ? undefined : { isActive: true },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function getUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Input validation for createUser / updateUser / resetPassword. We use Zod
// schemas so they can be reused on the client form too.

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("邮箱格式不正确");
const usernameSchema = z
  .string()
  .trim()
  .min(2, "用户名至少 2 个字符")
  .max(40, "用户名最多 40 个字符")
  .regex(/^[a-zA-Z0-9._-]+$/, "用户名仅支持字母/数字/.-_");
const displayNameSchema = z
  .string()
  .trim()
  .max(60, "昵称最多 60 个字符")
  .optional()
  .or(z.literal(""));
const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(128, "密码过长");
const roleSchema = z.enum(["ADMIN", "USER"]);

export const createUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
  role: roleSchema.default("USER"),
});

export const updateUserSchema = z.object({
  displayName: displayNameSchema,
  role: roleSchema,
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export async function createUser(input: CreateUserInput) {
  const data = createUserSchema.parse(input);
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);
  // Wrap the uniqueness check + insert in a transaction so two concurrent
  // admin "create new user" clicks cannot both win the race on email/username.
  return db.$transaction(async (tx) => {
    const existing = await tx.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
      select: { id: true, email: true, username: true },
    });
    if (existing) {
      throw new DuplicateUserError(existing.email, existing.username);
    }
    return tx.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName ? data.displayName : null,
        passwordHash,
        role: data.role,
        isActive: true,
      },
      select: { id: true, email: true, username: true, role: true },
    });
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const data = updateUserSchema.parse(input);
  return db.user.update({
    where: { id },
    data: {
      displayName: data.displayName ? data.displayName : null,
      role: data.role,
      isActive: data.isActive,
    },
    select: { id: true, role: true, isActive: true },
  });
}

export async function resetUserPassword(id: string, input: ResetPasswordInput) {
  const data = resetPasswordSchema.parse(input);
  const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_COST);
  return db.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true },
  });
}

export class DuplicateUserError extends Error {
  readonly code = "DUPLICATE_USER";
  constructor(
    public readonly email: string,
    public readonly username: string,
  ) {
    super(`邮箱或用户名已被使用: ${email} / ${username}`);
  }
}

// Re-export so callers that already imported Prisma can still find the type.
export type { Role };
export { Prisma };

import { z } from "zod";
