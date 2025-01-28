import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:8001/query",
  documents: ["src/**/*.tsx"],
  generates: {
    "./src/graphql/": {
      preset: "client-preset",
      plugins: [],
    },
  },
};
export default config;
