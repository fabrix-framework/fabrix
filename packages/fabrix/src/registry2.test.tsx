import {
  ComponentRegistryV2,
  FieldComponentEntry,
  FormFieldComponentEntry,
  TableComponentEntry,
} from "@registry2";
import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import { gql } from "urql";
import { ReactNode } from "react";
import { testWithUnmount } from "../__tests__/supports/render";

const customField1: FieldComponentEntry<{ name: string }> = {
  type: "field",
  component: (props) => <div>{props.customProps.name}</div>,
};

const customField2: FormFieldComponentEntry<{ age: number }> = {
  type: "formField",
  component: (props) => {
    return <div>{props.customProps.age}</div>;
  },
} as const;

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
      unit: {
        customField1,
        customField2,
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
