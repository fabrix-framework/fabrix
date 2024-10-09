import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { FabrixComponent } from "@renderer";
import { users } from "../tests/mocks/data";
import { testWithUnmount } from "../tests/render";

describe("query", () => {
  it("should render the view", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            users {
              collection {
                id
                name
                code
              }
            }
          }
        `}
      />,
      async () => {
        const table = await screen.findByRole("table");
        expect(table).toBeInTheDocument();

        const rows = await within(table).findAllByRole("row");
        expect(rows.length).toBe(users.length + 1);
      },
    );
  });
});

describe("mutation", () => {
  it("should render the form", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await screen.findByRole("form");
        expect(form).toBeInTheDocument();

        const inputs = await within(form).findAllByRole("textbox");
        expect(inputs.length).toBe(4);
      },
    );
  });
});
