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
        const output = await screen.findByRole("region", {
          name: /fabrix-component-output/,
        });
        const textContents = within(output)
          .getAllByRole("region")
          .map((field) => field.textContent);

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

  it.each([
    ["collection", collectionQuery],
    ["edges", edgeQuery],
  ])("should render the table (%s)", async (_, query) => {
    await testWithUnmount(<FabrixComponent query={query} />, async () => {
      const table = await screen.findByRole("table");
      const rowGroups = await within(table).findAllByRole("rowgroup");

      const headers = await within(rowGroups[0]).findAllByRole("columnheader");
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
    });
  });
});

describe("directive", () => {
  it("should render only the table when the directive is given", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers {
            users @fabrixView {
              collection {
                id
                name
                email
              }
            }
          }
        `}
      />,
      () => {
        expect(
          screen.queryByRole("region", {
            name: /fabrix-component-input/,
          }),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByRole("region", {
            name: /fabrix-component-output/,
          }),
        ).toBeInTheDocument();
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
});

describe("children props", () => {
  it("should render the components by functions from children props", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query getUsers($input: UsersQueryInput) {
            userEdges(input: $input) {
              edges {
                node {
                  id
                  name
                  age
                }
              }
            }
          }
        `}
      >
        {({ getOutput, getInput }) =>
          getInput({}, ({ getAction, Field }) => (
            <>
              <form role="form" {...getAction()}>
                <Field
                  name="input.first"
                  extraProps={{ label: "First size to get" }}
                />
                <Field
                  name="input.query"
                  extraProps={{ label: "Search query" }}
                />
                <button type="submit">Refetch</button>
              </form>
              <>
                <p>User List</p>
                {getOutput("userEdges")}
              </>
            </>
          ))
        }
      </FabrixComponent>,
      async () => {
        const table = await screen.findByRole("table");
        const rowGroups = await within(table).findAllByRole("rowgroup");
        const cells = await within(rowGroups[1]).findAllByRole("cell");

        expect(cells.map((v) => v.textContent)).toEqual([
          users[0].id,
          users[0].name,
          users[0].age + "",
          users[1].id,
          users[1].name,
          users[1].age + "",
        ]);

        const form = await screen.findByRole("form");

        const button = await within(form).findByRole("button");
        expect(within(button).getByText("Refetch")).toBeInTheDocument();

        const formFields = await within(form).findAllByRole("group");
        expect(
          await within(formFields[0]).findByLabelText("First size to get"),
        ).toBeInTheDocument();
        expect(
          await within(formFields[1]).findByLabelText("Search query"),
        ).toBeInTheDocument();
      },
    );
  });

  it("should be able to access the response data by selection", async () => {
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
        {({ getOutput }) =>
          getOutput("users", {}, ({ data }) => (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            <div role="result-size">{data.size}</div>
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
