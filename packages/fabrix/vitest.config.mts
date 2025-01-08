import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [viteReact(), tsconfigPaths()],
  test: {
    include: ["src/**/*.test.(tsx|ts)", "__tests__/**/*.test.(tsx|ts)"],
    environment: "happy-dom",
    setupFiles: ["./__tests__/setup.ts"],
  },
});
