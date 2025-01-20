import { ComponentRegistry, TableComponentEntry } from "@registry";
import { it, describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import { gql } from "urql";
import { testWithUnmount } from "./supports/render";

const components = new ComponentRegistry({
  custom: {
    composite: {
      myCustomTable: {
        type: "table",
        component: () => <div>custom table</div>,
      },
    },
  },
  default: {
    table: () => <div>default table</div>,
  },
});

const emptyComponentProps = {
  customProps: {},
  headers: [],
  values: [],
};

describe("merge", () => {
  const extraComponents = new ComponentRegistry({
    custom: {
      composite: {
        myCustomTable: {
          type: "table",
          component: () => <div>extra custom table</div>,
        },
      },
    },
  });

  const mergedComponents = components.merge(extraComponents);

  it("should override custom components by merging two registries", async () => {
    const Component = mergedComponents.getCustomComponent(
      "myCustomTable",
      "table",
    );

    await testWithUnmount(
      <Component {...emptyComponentProps} name="" />,
      () => {
        expect(screen.getByText("extra custom table")).toBeInTheDocument();
      },
      {
        noLoader: true,
      },
    );
  });
});

describe("getFabrixComponent", () => {
  const customTable: TableComponentEntry<{ title: string }> = {
    type: "table",
    component: (props) => {
      const headers = props.headers.map((header) => (
        <th key={header.key}>{header.label}</th>
      ));

      return (
        <>
          <h1>{props.customProps.title}</h1>
          <table>
            <thead>
              <tr>{headers}</tr>
            </thead>
            <tbody>
              {props.values.map((item, index) => (
                <tr key={index}>
                  {props.headers.map((header) => (
                    <td key={header.key}>{item[header.key] as ReactNode}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    },
  };

  const registry = new ComponentRegistry({
    custom: {
      composite: {
        customTable,
      },
    },
  });

  test("getCustom (customTable)", async () => {
    const CustomTable = registry.getFabrixComponent("customTable");

    await testWithUnmount(
      <CustomTable
        customProps={{
          title: "Custom Table",
        }}
        query={gql`
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
      />,
      async () => {
        expect(await screen.findByText("Custom Table")).toBeInTheDocument();

        const table = await screen.findByRole("table");
        expect(table).toBeInTheDocument();

        const rows = await within(table).findAllByRole("row");
        expect(rows.length).toBe(3);
      },
    );
  });

  test("getCustom (customTable) with children", async () => {
    const CustomTable = registry.getFabrixComponent("customTable");

    await testWithUnmount(
      <CustomTable
        customProps={{
          title: "Custom Table",
        }}
        query={gql`
          query {
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
        {({ getComponent }) => {
          return (
            <div data-testid="component-wrapper">{getComponent("users")}</div>
          );
        }}
      </CustomTable>,
      async () => {
        const wrapper = await screen.findByTestId("component-wrapper");
        const table = await within(wrapper).findByRole("table");
        expect(table).toBeInTheDocument();
      },
    );
  });
});

describe("getDefaultComponentByType", () => {
  it("should render the default component by name", async () => {
    const Component = components.getDefaultComponentByType("table");

    await testWithUnmount(
      <Component {...emptyComponentProps} name="" />,
      () => {
        expect(screen.getByText("default table")).toBeInTheDocument();
      },
      {
        noLoader: true,
      },
    );
  });
});

describe("getCustomComponentByNameWithFallback", () => {
  test("should render the component by name", async () => {
    const Component = components.getCustomComponent("myCustomTable", "table");

    await testWithUnmount(
      <Component {...emptyComponentProps} name="" />,
      () => {
        expect(screen.getByText("custom table")).toBeInTheDocument();
      },
      {
        noLoader: true,
      },
    );
  });

  test("should render the fallback component", async () => {
    const Component = components.getCustomComponent(
      // @ts-expect-error TS2345
      "unregistered-table",
      "table",
    );

    await testWithUnmount(
      <Component {...emptyComponentProps} name="defaultTable" />,
      () => {
        expect(screen.getByText("default table")).toBeInTheDocument();
      },
      {
        noLoader: true,
      },
    );
  });
});
