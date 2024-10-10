import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { FabrixComponent } from "@renderer";
import { users } from "../tests/mocks/data";
import { testWithUnmount } from "../tests/render";

describe("query", () => {
  it("should render the table with collection", async () => {
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
        expect(inputs.length).toBe(5);
      },
    );
  });

  it("should render the form with customized labels", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "id", config: { hidden: true } },
              { field: "name", config: { label: "UserName" } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await screen.findByRole("form");
        expect(form).toBeInTheDocument();

        expect(within(form).queryByLabelText("id")).not.toBeInTheDocument();
        expect(within(form).getByLabelText("name")).toHaveTextContent(
          "UserName",
        );
      },
    );
  });
});
