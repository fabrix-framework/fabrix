import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [viteReact(), tsconfigPaths()],
  test: {
    include: ["src/**/*.test.tsx", "__tests__/**/*.test.tsx"],
    environment: "happy-dom",
    setupFiles: ["./__tests__/setup.ts"],
  },
});
