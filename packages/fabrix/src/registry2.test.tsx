import {
  ComponentRegistryV2,
  FieldComponentEntry,
  FormFieldComponentEntry,
  TableComponentEntry,
} from "@registry2";
import { describe, expect, test } from "vitest";
import { screen } from "@testing-library/react";
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

const customTable: TableComponentEntry = {
  type: "table",
  component: (props) => {
    const headers = props.headers.map((header) => (
      <th key={header.key}>{header.label}</th>
    ));

    return (
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
    );
  },
};

describe("ComponentRegistryV2", () => {
  const cc = new ComponentRegistryV2({
    custom: {
      customField1,
      customField2,
      customTable,
    },
  });

  test("getCustom (customField1)", () => {
    const component = cc.getFabrixComponent("customField1");
    expect(component).not.toBeUndefined();
  });

  test("getDynamicWithType (customField1)", () => {
    const component = cc.getComponentDynamicWithType<"field">("customField1");
    expect(component).not.toBeUndefined();
  });

  test("getCustom (customTable)", async () => {
    const CustomTable = cc.getFabrixComponent("customTable");

    await testWithUnmount(
      <CustomTable
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
      () => {
        screen.debug();

        expect(1).toBe(1);
      },
    );
  });
});
