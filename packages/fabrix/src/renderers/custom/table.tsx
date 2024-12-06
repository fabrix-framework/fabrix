import { FabrixContext, FabrixContextType } from "@context";
import { FabrixComponentData } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { getSubFields, getTableType, SubFields } from "@renderers/fields";
import { FieldConfigByType } from "@renderers/shared";
import { createElement, useContext } from "react";

export const TableRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<TableComponentEntry>;
    data: FabrixComponentData;
  },
) => {
  const context = useContext(FabrixContext);
  const field = props.fieldConfig;
  const { rootValue, collectionValue } = ensureCollectionValue(
    props.data,
    props.fieldConfig.name,
  );

  const tableMode = getTableType(field.configs.fields);
  const subFields = getSubFields(
    context,
    rootValue,
    field.configs.fields,
    tableMode == "standard" ? "collection" : "edges.node",
  );

  return createElement(props.component.entry.component, {
    name: field.name,
    headers: buildHeaders(context, subFields),
    values: collectionValue,
    customProps: props.component.customProps,
  });
};

const ensureCollectionValue = (
  value: FabrixComponentData | undefined,
  rootName: string,
) => {
  const rootValue = value?.[rootName];

  if (!rootValue || !("collection" in rootValue)) {
    throw new Error("Table requires a collection value");
  }

  const collectionValue = rootValue.collection;
  if (!Array.isArray(collectionValue)) {
    throw new Error("Table requires a collection value to be an array");
  }

  return {
    collectionValue,
    rootValue,
  };
};

const buildHeaders = (context: FabrixContextType, subFields: SubFields) =>
  subFields.flatMap((subField) => {
    if (subField.value.config.hidden) {
      return [];
    }

    const component =
      context.componentRegistry.getCustomComponentByNameWithFallback(
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

    const key = subField.value.field.getName();
    const cellRenderer = component
      ? (rowValue: Record<string, unknown>) => {
          return createElement(component, {
            key,
            name: key,
            path: subField.value.field.value,
            type: subField.type,
            value: rowValue,
            subFields: subFields.map((subField) => ({
              key: subField.value.field.getName(),
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
      label: subField.label,
      key: subField.value.field.getName(),
      type: subField.type,
      render: cellRenderer,
    };
  });
