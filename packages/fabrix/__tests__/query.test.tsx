import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { FabrixComponent } from "@renderer";
import { ComponentRegistry } from "@registry";
import { users } from "./mocks/data";
import { testWithUnmount } from "./supports/render";

describe("query", () => {
  it("should render the fields", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query {
            firstUser {
              id
              name
              email
              address {
                city
                street
                zip
              }
            }
          }
        `}
      />,
      async () => {
        const fields = await screen.findAllByRole("region");
        const textContents = fields.map((field) => field.textContent);

        const user = users[0];
        expect(textContents).toEqual([
          `id:${user.id}`,
          `name:${user.name}`,
          `email:${user.email}`,
          `address.city:${user.address.city}`,
          `address.street:${user.address.street}`,
          `address.zip:${user.address.zip}`,
        ]);
      },
    );
  });
});

describe("collection", () => {
  type FabrixComponentChildrenProps = Parameters<
    typeof FabrixComponent
  >[0]["children"];

  const collectionQuery = `
    query getUsers {
      users {
        collection {
          id
          name
          age
          category
          address {
            zip
          }
        }
      }
    }
  `;

  const edgeQuery = `
    query getUsers {
      userEdges {
        edges {
          node {
            id
            name
            age
            category
            address {
              zip
            }
          }
        }
      }
    }
  `;

  const testPatterns = [
    ["collection", collectionQuery, undefined],
    ["edges", edgeQuery, undefined],
    [
      "getComponent",
      collectionQuery,
      ({ getComponent }) => getComponent("users"),
    ],
  ] satisfies [string, string, FabrixComponentChildrenProps][];

  it.each(testPatterns)(
    "should render the table (%s)",
    async (_, query, children) => {
      await testWithUnmount(
        <FabrixComponent query={query}>{children}</FabrixComponent>,
        async () => {
          const table = await screen.findByRole("table");
          const rowGroups = await within(table).findAllByRole("rowgroup");

          const headers = await within(rowGroups[0]).findAllByRole(
            "columnheader",
          );
          const headerNames = headers.map((v) => v.textContent);
          expect(headerNames).toEqual([
            "id (Scalar:ID)",
            "name (Scalar:String)",
            "age (Scalar:Int)",
            "category (Enum:UserCategory)",
            "zip (Scalar:String)",
          ]);

          const cells = await within(rowGroups[1]).findAllByRole("cell");
          expect(cells.map((v) => v.textContent)).toEqual([
            users[0].id,
            users[0].name,
            users[0].age + "",
            users[0].category,
            users[0].address.zip,
            users[1].id,
            users[1].name,
            users[1].age + "",
            users[1].category,
            users[1].address.zip,
          ]);
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
      custom: {
        unit: {
          actionCell: {
            type: "tableCell",
            component: (props) => (
              <button role="button">{props.userProps?.["label"]}</button>
            ),
          } as const,
        },
      },
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

  it("should be able to access the response data for by an operation", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            users {
              size
            }
          }
        `}
      >
        {({ data }) => (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          <div role="result-size">{data.users.size}</div>
        )}
      </FabrixComponent>,
      async () => {
        const result = await screen.findByRole("result-size");
        expect(result).toBeInTheDocument();
        expect(result).toHaveTextContent(users.length.toString());
      },
    );
  });
});
