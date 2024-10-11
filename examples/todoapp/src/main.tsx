import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ComponentRegistry, FabrixProvider } from "@fabrix-framework/fabrix";
import { ChakraUIRegistry } from "@fabrix-framework/chakra-ui";
import { ChakraProvider } from "@chakra-ui/react";
import { ActionCell } from "./registry.tsx";
import App from "./App.tsx";
import "./index.css";
import "./columns.css";

const TodoAppComponents = new ComponentRegistry({
  custom: [ActionCell],
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider>
      <FabrixProvider
        url={"http://localhost:8001/graphql"}
        componentRegistry={ChakraUIRegistry.merge(TodoAppComponents)}
      >
        <App />
      </FabrixProvider>
    </ChakraProvider>
  </StrictMode>,
);
