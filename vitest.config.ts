// Vitest configuration for Phase 1+ unit tests.
//
// - node: the default environment. Pure logic (visibility, rate-limit,
//   formatting helpers) runs here.
// - happy-dom: for any future component tests. We pick it over jsdom for
//   the smaller footprint and faster boot, matching the lockfile policy
//   in docs/technology-baseline.md.
// - The @ alias mirrors tsconfig.json so `import "@/..."` works in tests.
// - src/**/*.{test,spec}.{ts,tsx} is the discovery pattern.

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: false,
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/middleware.ts"],
      exclude: ["**/*.d.ts"],
    },
  },
});
