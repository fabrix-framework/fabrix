import { ComponentRegistry, FieldComponentProps } from "@registry";
import { gql } from "graphql-tag";
import { describe, expect, test } from "vitest";

describe("ComponentRegistry", () => {
  describe("merge", () => {
    const registry1 = new ComponentRegistry({
      custom: [
        {
          name: "CustomField1",
          type: "field",
          component: (props: FieldComponentProps) => (
            <div>{props.value as string}</div>
          ),
        },
      ],
    });

    const registry2 = new ComponentRegistry({
      custom: [
        {
          name: "CustomField2",
          type: "field",
          component: (props: FieldComponentProps) => (
            <div>{props.value as string}</div>
          ),
        },
      ],
    });

    const mergedRegistry = registry1.merge(registry2);

    test("should be able to get custom components from both registries", () => {
      expect(
        mergedRegistry.getCustom("CustomField1", "field"),
      ).not.toBeUndefined();
      expect(
        mergedRegistry.getCustom("CustomField2", "field"),
      ).not.toBeUndefined();
    });
  });

  describe("getCustom", () => {
    const registry = new ComponentRegistry({
      custom: [
        {
          name: "CustomField",
          type: "field",
          component: (props: FieldComponentProps) => (
            <div>{props.value as string}</div>
          ),
        },
      ],
    });

    test("should be able to get a custom components with name and type", () => {
      expect(registry.getCustom("CustomField", "field")).not.toBeUndefined();
    });

    test("should return undefined if the custom component is not found or with the incorrect type", () => {
      expect(registry.getCustom("NotFound", "field")).toBeUndefined();
      expect(registry.getCustom("CustomField", "form")).toBeUndefined();
    });
  });

  describe("addFragment", () => {
    const registry = new ComponentRegistry({});

    test("should be able to add a fragment to the registry", () => {
      registry.addFragment<{
        id: string;
        name: string;
      }>({
        query: gql`
          fragment TestFragment on Test {
            id
            name
          }
        `,
        component: (props) => <div>{props.values.id}</div>,
      });

      expect(registry.getFragment("TestFragment")).not.toBeUndefined();
    });

    test("should fail in adding multiple fragments", () => {
      expect(() => {
        registry.addFragment({
          query: gql`
            fragment Fragment1 on Test {
              id
              name
            }

            fragment Fragment2 on Test {
              id
              name
            }
          `,
          component: () => <div />,
        });
      }).toThrow();
    });

    test("should fail if no fragment is added", () => {
      expect(() => {
        registry.addFragment({
          query: gql``,
          component: () => <div />,
        });
      }).toThrow();
    });
  });
});
