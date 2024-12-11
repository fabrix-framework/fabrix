import { Value } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { FieldConfigByType } from "@renderers/shared";
import { getTableMode, renderTableElement } from "@renderers/table";

export const CustomComponentTableRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<TableComponentEntry>;
    data: Value;
  },
) => {
  const tableMode = getTableMode(props.fieldConfig.configs.fields);
  if (!tableMode) {
    throw new Error("Unsupported table mode");
  }

  return renderTableElement({
    component: props.component.entry.component,
    customProps: props.component.customProps,
    rootField: {
      name: props.fieldConfig.name,
      fields: props.fieldConfig.configs.fields,
      data: props.data,
    },
    tableMode,
  });
};
