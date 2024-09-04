import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    css: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
  },
});
