# `@fabrix-framework/graphql-config`

This package provides all fabrix directive definitions

## Install

```bash
npm install -D @fabrix-framework/graphql-config
```

## Usage

Write your `graphql.config.ts` as follows:

```ts
import type { IGraphQLConfig } from "graphql-config";
import { generateConfig } from "@fabrix-framework/graphql-config";

const url = "https://localhost:8080/query";
const fabrixConfig = generateConfig();

const config: IGraphQLConfig = {
  schema: [fabrixConfig.directiveSchema, url],
  documents: "src/**/*.{graphql,ts,tsx}",
  extensions: {
    endpoints: {
      default: {
        url,
      },
    },
  },
};

export default config;
```
