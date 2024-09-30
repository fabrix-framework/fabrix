import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FabrixProvider } from "@fabrix-framework/fabrix";
import { ChakraUIRegistry } from "@fabrix-framework/chakra-ui";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.tsx";
import "./index.css";
import "./columns.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider>
      <FabrixProvider
        url={"http://localhost:8001/graphql"}
        componentRegistry={ChakraUIRegistry}
      >
        <App />
      </FabrixProvider>
    </ChakraProvider>
  </StrictMode>,
);
