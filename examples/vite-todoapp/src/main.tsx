import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { FabrixProvider, gql } from "@fabrix-framework/fabrix";
import { UnstyledRegistry } from "@fabrix-framework/unstyled";
import App from "./App.tsx";
import "./index.css";
import "./columns.css";

/*
const TodoAppComponents = new ComponentRegistry({
  custom: {
    unit: {
      IDActionCell,
    },
  },
});
*/

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FabrixProvider
      url={"http://localhost:8001/graphql"}
      componentRegistry={UnstyledRegistry}
      operationSchema={gql`
        mutation markTodoDone($input: MarkTodoDoneInput!) {
          markTodoDone(input: $input) {
            id
          }
        }
      `}
    >
      <App />
    </FabrixProvider>
  </StrictMode>,
);
