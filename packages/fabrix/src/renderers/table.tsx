import { FabrixContextType } from "@context";
import { Value } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { createElement } from "react";
import { z } from "zod";
import { RootField, SubFields, ViewFields, getSubFields } from "./fields";
import { Loader } from "./shared";
import { buildTypenameExtractor } from "./typename";

const tableModes = {
  standard: "collection",
  relay: "edges",
} as const;

export type TableMode = keyof typeof tableModes;

export const getTableMode = (fields: ViewFields) => {
  const modeKeyFields = Object.values(tableModes) as string[];
  const keyField = fields.find((f) =>
    modeKeyFields.includes(f.field.getName()),
  );
  if (!keyField) {
    return null;
  }
  return keyField.field.getName() == "collection" ? "standard" : "relay";
};

const collectionValidator = z.object({
  collection: z.array(z.record(z.unknown())),
});
const relayValidator = z.object({
  edges: z.array(
    z.object({
      node: z.record(z.unknown()),
    }),
  ),
});

export const getTableValues = (
  rootValue: Value,
  mode: TableMode,
): Record<string, unknown>[] => {
  const value = rootValue as Record<string, unknown>;
  switch (mode) {
    case "standard": {
      const r = collectionValidator.safeParse(value);
      return r.success ? r.data.collection : [];
    }
    case "relay": {
      const r = relayValidator.safeParse(value);
      return r.success ? r.data.edges.map((e) => e.node) : [];
    }
  }
};

export const renderTable = (
  context: FabrixContextType,
  rootField: RootField,
  tableMode: TableMode,
) => {
  const component =
    context.componentRegistry.getDefaultComponentByType("table");
  if (!component) {
    return;
  }

  return renderTableElement({
    context,
    component,
    customProps: {},
    rootField,
    tableMode,
  });
};

export const renderTableElement = (props: {
  context: FabrixContextType;
  component: TableComponentEntry["component"];
  customProps: unknown;
  rootField: RootField;
  tableMode: TableMode;
}) => {
  const { name, data, fields } = props.rootField;
  const rootValue = data;
  if (!rootValue) {
    return;
  }

  const schema = props.context.schemaLoader;
  if (schema.status === "loading") {
    return <Loader />;
  }

  const typenameExtractor = buildTypenameExtractor({
    targetValue: rootValue,
    schemaSet: schema.schemaSet,
  });

  const { component, tableMode } = props;
  const basePath = tableMode == "standard" ? "collection" : "edges.node";
  const subFields = getSubFields(typenameExtractor, fields, basePath);
  return createElement(component, {
    name,
    headers: buildHeaders(props.context, subFields, basePath),
    values: getTableValues(rootValue, tableMode),
    customProps: props.customProps,
  });
};

export const buildHeaders = (
  context: FabrixContextType,
  subFields: SubFields,
  basePath: string,
) =>
  subFields.flatMap((subField) => {
    if (subField.value.config.hidden) {
      return [];
    }

    const component = context.componentRegistry.getCustomComponent(
      subField.value.config.componentType?.name,
      "tableCell",
    );

    const userProps = subField.value.config.componentType?.props?.reduce(
      (acc, prop) => {
        return {
          ...acc,
          [prop.name]: prop.value,
        };
      },
      {},
    );

    const key = subField.value.field.asKey().slice(basePath.length + 1);
    const name = subField.value.field.getName();
    const cellRenderer = component
      ? (rowValue: Record<string, unknown>) => {
          return createElement(component, {
            key,
            name,
            path: subField.value.field.value,
            type: subField.type,
            value: rowValue,
            subFields: subFields.map((subField) => ({
              key: subField.value.field.asKey().slice(basePath.length + 1),
              label: subField.label,
              type: subField.type,
            })),
            attributes: {
              className: "",
              label: subField.label,
            },
            userProps,
          });
        }
      : null;

    return {
      key,
      label: subField.label,
      type: subField.type,
      render: cellRenderer,
    };
  });
