import { FabrixContext, FabrixContextType } from "@context";
import { Value } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { useContext, createElement } from "react";
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

  const schema = context.schemaLoader;
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
  const element = createElement(component, {
    name,
    headers: buildHeaders(context, subFields, basePath),
    values: getTableValues(rootValue, tableMode),
    customProps: props.customProps,
  });

  return <div className={"fabrix table"}>{element}</div>;
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
