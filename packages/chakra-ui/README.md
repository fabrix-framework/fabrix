# `@fabrix-framework/chakra-ui`

Chakra UI component registry for fabrix

## Install

```bash
npm install --save @fabrix-framework/chakra-ui
```

You also need to setup Chakra UI in your app.

## Usage

```tsx
import { ChakraUIRegistry } from "@fabrix-framework/chakra-ui";
import { ChakraProvider } from "@chakra-ui/react";

const App = () =>
  <ChakraProvider>
    <FabrixProvider
      url={/* your GraphQL API URL */}
      componentRegistry={ChakraUIRegistry}
    >
      <TheRestOfYourApplication />
    </FabrixProvider>
  </ChakraProvider>
```
