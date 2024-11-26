import { FabrixComponent } from "@renderer";
import { describe, expect, it } from "vitest";
import { ComponentRegistry } from "@registry";
import { testWithUnmount } from "./supports/render";

describe("query with fragment", () => {
  it("should render a component with a fragment", async () => {
    const components = new ComponentRegistry({});

    components.addFragment({
      query: `
        fragment userImage on User {
          imageURL
        }
      `,
      component: () => <div>imageURL</div>,
    });

    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUser {
            user {
              id
              name
              ...userImage
            }
          }
        `}
      />,
      () => {
        expect(1).toBe(1);
      },
      { components },
    );
  });
});
