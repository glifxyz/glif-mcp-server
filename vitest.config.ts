import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 5_000,
    reporters: ["verbose"],
    exclude: [...configDefaults.exclude, "build/*", "dist/*"],
  },
});
