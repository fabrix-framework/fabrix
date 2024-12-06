import { FabrixContext } from "@context";
import { FabrixComponentData } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { buildHeaders, getSubFields, getTableType } from "@renderers/fields";
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
