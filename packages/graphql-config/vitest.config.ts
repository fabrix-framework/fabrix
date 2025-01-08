import { defineConfig } from "vitest/config";
import { stringPlugin } from "vite-string-plugin";

export default defineConfig({
  plugins: [
    // Load .graphql files as strings as production build with tsup also does
    stringPlugin({
      match: /\.graphql$/,
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
