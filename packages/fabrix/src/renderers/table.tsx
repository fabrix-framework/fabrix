import { FabrixContext, FabrixContextType } from "@context";
import { Value } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { useContext, createElement } from "react";
import { RootField, SubFields, ViewFields, getSubFields } from "./fields";

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

export const getTableValues = (
  rootValue: Value,
  mode: TableMode,
): Record<string, unknown>[] => {
  const value = rootValue as Record<string, unknown>;
  switch (mode) {
    case "standard":
      return value.collection as Record<string, unknown>[];
    case "relay":
      return (value.edges as { node: Record<string, unknown> }[]).map(
        ({ node }) => node,
      );
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
    component,
    customProps: {},
    rootField,
    tableMode,
  });
};

export const renderTableElement = (props: {
  component: TableComponentEntry["component"];
  customProps: unknown;
  rootField: RootField;
  tableMode: TableMode;
}) => {
  const context = useContext(FabrixContext);
  const { name, data, fields } = props.rootField;
  const rootValue = data;
  if (!rootValue) {
    return;
  }

  const { component, tableMode } = props;
  const subFields = getSubFields(
    context,
    rootValue,
    fields,
    tableMode == "standard" ? "collection" : "edges.node",
  );

  const element = createElement(component, {
    name,
    headers: buildHeaders(context, subFields),
    values: getTableValues(rootValue, tableMode),
    customProps: props.customProps,
  });

  return <div className={"fabrix table"}>{element}</div>;
};

export const buildHeaders = (
  context: FabrixContextType,
  subFields: SubFields,
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

    const key = subField.value.field.asKey();
    const cellRenderer = component
      ? (rowValue: Record<string, unknown>) => {
          return createElement(component, {
            key,
            name: key,
            path: subField.value.field.value,
            type: subField.type,
            value: rowValue,
            subFields: subFields.map((subField) => ({
              key: subField.value.field.asKey(),
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
