import { defineConfig } from "vitest/config";
import graphqlLoader from "vite-plugin-graphql-loader";

export default defineConfig({
  plugins: [graphqlLoader()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
