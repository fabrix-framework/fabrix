import { FabrixComponent } from "@renderer";
import { screen } from "@testing-library/react";
import { describe, it } from "vitest";
import { testWithUnmount } from "./supports/render";

describe("query", () => {
  it("should render the table with edges", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            userEdges {
              edges {
                node {
                  id
                  name
                  email
                  address {
                    zip 
                  }
                }
              }
            }
          }
        `}
      />,
      async () => {
        screen.debug();
      },
    );
  });
});
