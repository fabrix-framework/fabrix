import { defineConfig } from "vitest/config";
import stringPlugin from "vite-plugin-string";

export default defineConfig({
  plugins: [
    // Load .graphql files as strings as production build with tsup also does
    stringPlugin({
      include: "**/*.graphql",
      compress: false,
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
