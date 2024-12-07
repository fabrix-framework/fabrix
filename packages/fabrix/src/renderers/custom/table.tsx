import { FabrixContext } from "@context";
import { FabrixComponentData } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import {
  buildHeaders,
  getSubFields,
  getTableType,
  getTableValues,
} from "@renderers/fields";
import { FieldConfigByType } from "@renderers/shared";
import { createElement, useContext } from "react";

export const TableRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<TableComponentEntry>;
    data: FabrixComponentData | undefined;
  },
) => {
  const context = useContext(FabrixContext);
  const field = props.fieldConfig;
  const rootValue = props.data?.[props.fieldConfig.name];
  if (!rootValue) {
    return;
  }

  const tableMode = getTableType(field.configs.fields);
  if (!tableMode) {
    throw new Error("Unsupported table mode");
  }

  const subFields = getSubFields(
    context,
    rootValue,
    field.configs.fields,
    tableMode == "standard" ? "collection" : "edges.node",
  );

  return createElement(props.component.entry.component, {
    name: field.name,
    headers: buildHeaders(context, subFields),
    values: getTableValues(rootValue, tableMode),
    customProps: props.component.customProps,
  });
};
