import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { FabrixComponent } from "@renderer";
import { ComponentRegistry } from "@registry";
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

  it("should render the table with customized labels", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            users @fabrixView(input: [
              { field: "collection.name", config: { label: "UserName" } }
            ]) {
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

        expect(rows[0]).toHaveTextContent("UserName");
      },
    );
  });

  it("should render the table with virtual columns", async () => {
    const components = new ComponentRegistry({
      custom: [
        {
          name: "ActionCell",
          type: "tableCell",
          component: (props) => <button>{props.userProps?.["label"]}</button>,
        } as const,
      ],
    });

    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            users @fabrixView(input: [
              {
                field: "collection.actions",
                config: {
                  label: "操作",
                  componentType: {
                    name: "ActionCell",
                    props: [
                      { name: "label", value: "Delete" },
                      { name: "color", value: "red" },
                      { name: "mutation", value: "deleteUser" }
                    ]
                  }
                }
              }
            ]) {
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

        expect(rows[0]).toHaveTextContent("操作");
      },
      { components },
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
