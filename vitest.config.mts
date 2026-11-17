import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/domain/**", "src/lib/data/**", "src/lib/push/cron.ts"],
      exclude: ["**/*.test.ts", "**/test-helpers.ts", "src/lib/data/supabase-repository.ts"],
      reporter: ["text-summary", "text"],
      // Regras de negócio: cobertura alta obrigatória (o CI falha abaixo disso).
      thresholds: {
        "src/lib/domain/**": { lines: 95, functions: 95, branches: 85, statements: 95 },
      },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
