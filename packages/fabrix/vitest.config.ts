import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [viteReact(), tsconfigPaths()],
  test: {
    include: ["src/**/*.test.tsx"],
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
  },
});
