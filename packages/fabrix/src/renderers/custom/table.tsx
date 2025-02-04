import { Value } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { FieldConfigByType } from "@renderers/shared";
import { getTableMode, renderTableElement } from "@renderers/table";
import { FabrixContext } from "@context";
import { useContext } from "react";

export const CustomComponentTableRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"generic">;
    component: ComponentRendererProps<TableComponentEntry>;
    data: Value;
  },
) => {
  const context = useContext(FabrixContext);
  const tableMode = getTableMode(props.fieldConfig.configs.outputFields);
  if (!tableMode) {
    throw new Error("Unsupported table mode");
  }

  return renderTableElement({
    context,
    component: props.component.entry.component,
    customProps: props.component.customProps,
    rootField: {
      name: props.fieldConfig.name,
      fields: props.fieldConfig.configs.outputFields,
      data: props.data,
    },
    tableMode,
  });
};
