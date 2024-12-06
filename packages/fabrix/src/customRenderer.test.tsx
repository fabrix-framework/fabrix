import { FabrixCustomComponent } from "@customRenderer";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { testWithUnmount } from "../__tests__/supports/render";

describe("FabrixCustomComponent", () => {
  it("should render", async () => {
    await testWithUnmount(
      <FabrixCustomComponent
        query={`
          query getUser {
            users {
              collection {
                name
                email
              }
            }
          }
        `}
        component={{
          name: "usersTable",
          entry: {
            type: "table",
            component: () => (
              <div>
                <h1>usersTable</h1>
              </div>
            ),
          },
        }}
      />,
      () => {
        expect(screen.getByText("usersTable")).toBeInTheDocument();
      },
    );
  });
});
