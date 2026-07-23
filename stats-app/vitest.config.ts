import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * vitest.config.ts
 *
 * Why it exists: Configures vitest for unit tests in the stats-app.
 * Uses Node environment (not jsdom) since tests target pure TypeScript functions,
 * not browser/React components.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "components/**/*.ts"],
      exclude: ["lib/github/types.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@lib": resolve(__dirname, "./lib"),
      "@components": resolve(__dirname, "./components"),
    },
  },
});
