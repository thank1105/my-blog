# Prisma 6.19.3 — 已知问题与临时方案

> 记录于 Phase 0 验收时发现的问题与处置方式，下一次评估 `docs/technology-baseline.md` 时复审。

## Windows + Prisma 6.19.3 schema-engine 解析缺陷

**现象**

在全新环境（`prisma/dev.db` 不存在）首次执行 `pnpm prisma db push` 时，Prisma CLI 会调用内嵌的 `schema-engine-windows.exe` 进行 `can-connect-to-database` → `create-database` 的握手。schema-engine 把 JSON 日志逐行写到 stderr，但 Prisma CLI 内的 `ape()` 解析器假设 stderr 开头有一行非 JSON 的 banner，会 `slice(1)` 丢掉首行之后再解析剩下的内容。Windows 二进制并不输出 banner，于是首个 JSON 行被丢弃，剩余为空，最终抛出无任何 `error_code` / `message` 文本的 `Error: Schema engine error:`。

**临时方案**

仓库根目录的 `scripts/db-prepare.cjs` 会在运行 `pnpm prisma:push`、`pnpm dev`、`pnpm prisma:migrate` 之前预创建空的 `prisma/dev.db`，让 schema-engine 直接进入 “DB 已存在” 的路径，从而绕过那个有缺陷的 `create-database` 流程。脚本里带注释说明，等 Prisma 上游修复或在 6.19.x 后续补丁里移除该限制时同步清理。

**复审触发**

- 升级到 6.20.x 或更高 Prisma 版本（baseline 复审）。
- 上游 Prisma 在该 issue 上有修复 release。
- 我们换到 macOS / Linux 开发（该问题目前仅在 Windows 重现）。

## dotenvx 横幅输出

`pnpm prisma ...` 子命令会从 `.env` 加载环境变量，`@dotenvx/dotenvx` 会在 stderr 打印 `Environment variables loaded from .env`。PowerShell 会把任何 stderr 内容识别为 `NativeCommandError`，导致 `$LASTEXITCODE` 看似非零——脚本实际返回码仍是 0，命令执行成功。无需处置；如果觉得噪音太大，可以升级 PowerShell 到 7+（stderr 不再被错误识别）。
