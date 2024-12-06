import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { FabrixComponent } from "@renderer";
import { ComponentRegistry } from "@registry";
import { users } from "./mocks/data";
import { testWithUnmount } from "./supports/render";

type FabrixComponentChildrenProps = Parameters<
  typeof FabrixComponent
>[0]["children"];

describe("query", () => {
  const childrenPropPattern = [
    ["no children", undefined],
    ["getOperation", ({ getOperation }) => getOperation("getUsers")],
    [
      "getOperation/getComponent",
      ({ getOperation }) =>
        getOperation("getUsers", ({ getComponent }) => getComponent("users")),
    ],
    ["getComponent", ({ getComponent }) => getComponent("getUsers", "users")],
  ] satisfies [string, FabrixComponentChildrenProps][];
  it.each(childrenPropPattern)(
    "should render the table with collection | %s",
    async (_, children) => {
      await testWithUnmount(
        <FabrixComponent
          query={`
          query getUsers {
            users {
              collection {
                id
                name
                email
              }
            }
          }
        `}
        >
          {children}
        </FabrixComponent>,
        async () => {
          const table = await screen.findByRole("table");
          expect(table).toBeInTheDocument();

          const rows = await within(table).findAllByRole("row");
          expect(rows.length).toBe(users.length + 1);
        },
      );
    },
  );

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
                email
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
          component: (props) => (
            <button role="button">{props.userProps?.["label"]}</button>
          ),
        } as const,
      ],
    });

    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            users @fabrixView(input: [
              {
                field: "collection.id",
                config: {
                  hidden: true
                }
              },
              {
                field: "collection.actions",
                config: {
                  label: "操作",
                  index: -1
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
                email
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

        const headers = within(rows[0]).getAllByRole("columnheader");
        expect(headers[0]).toHaveTextContent("操作");
      },
      { components },
    );
  });

  it("should render the table with collection", async () => {
    await testWithUnmount(
      <FabrixComponent query={`query getUsers { users { size } }`}>
        {({ getOperation }) =>
          getOperation<{ users: { size: number } }>("getUsers", ({ data }) => (
            <div role="result-size">{data.users.size}</div>
          ))
        }
      </FabrixComponent>,
      async () => {
        const result = await screen.findByRole("result-size");
        expect(result).toBeInTheDocument();
        expect(result).toHaveTextContent(users.length.toString());
      },
    );
  });
});
