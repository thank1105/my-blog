const fs = require('fs');
const path = require('path');

const root = process.cwd();

/**
 * Ensure the SQLite database file exists before running Prisma commands.
 *
 * Prisma 6.19.3 has a known bug on Windows where the schema engine's stderr
 * parser expects a leading non-JSON banner line that the engine does not emit,
 * so the very first `can-connect-to-database` -> `create-database` handshake
 * fails with an empty "Schema engine error:". Once `prisma/dev.db` exists
 * (even empty), the engine succeeds on the connect probe and `db push`
 * proceeds normally. This helper pre-creates the file as a workaround.
 *
 * Will be re-evaluated when Prisma ships a fix or when we update past 6.19.x.
 */

const dbPath = path.join(root, 'prisma', 'dev.db');

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('[db-prepare] created', path.relative(root, dbPath));
} else {
  console.log('[db-prepare] present', path.relative(root, dbPath));
}
