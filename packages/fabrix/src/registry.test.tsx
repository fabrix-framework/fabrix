import { ComponentRegistryV2, TableComponentEntry } from "@registry";
import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import { gql } from "urql";
import { ReactNode } from "react";
import { testWithUnmount } from "../__tests__/supports/render";

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

describe("ComponentRegistryV2", () => {
  const registry = new ComponentRegistryV2({
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
          title: "Users",
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
        const table = await screen.findByRole("table");
        expect(table).toBeInTheDocument();

        const rows = await within(table).findAllByRole("row");
        expect(rows.length).toBe(3);
      },
    );
  });

  test("getCustom (customTable) with getComponent", async () => {
    const CustomTable = registry.getFabrixComponent("customTable");

    await testWithUnmount(
      <CustomTable
        customProps={{
          title: "Users",
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
      >
        {({ getComponent }) => (
          <div className="customized-table">
            <div>This is customized table</div>
            {getComponent("getUsers")}
          </div>
        )}
      </CustomTable>,
      async () => {
        expect(
          screen.getByText("This is customized table"),
        ).toBeInTheDocument();

        const table = await screen.findByRole("table");
        expect(table).toBeInTheDocument();

        const rows = await within(table).findAllByRole("row");
        expect(rows.length).toBe(3);
      },
    );
  });
});
