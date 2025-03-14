/// <reference types="node" />
import { defineConfig } from "tsup";

const devOpts =
  process.env.NODE_ENV === "development"
    ? {
        minify: false,
        splitting: false,
        sourcemap: true,
      }
    : {};

export default defineConfig({
  format: ["esm"],
  entry: ["src/index.ts", "src/schema.ts"],
  clean: true,
  minify: true,
  dts: true,
  loader: {
    ".graphql": "text",
  },
  ...devOpts,
});
