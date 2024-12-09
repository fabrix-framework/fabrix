import { FabrixComponentData } from "@fetcher";
import { TableComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { FieldConfigByType } from "@renderers/shared";
import { getTableMode, renderTableElement } from "@renderers/table";

export const CustomComponentTableRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<TableComponentEntry>;
    data: FabrixComponentData | undefined;
  },
) => {
  const rootField = {
    name: props.fieldConfig.name,
    data: props.data?.[props.fieldConfig.name],
    fields: props.fieldConfig.configs.fields,
  };

  const tableMode = getTableMode(props.fieldConfig.configs.fields);
  if (!tableMode) {
    throw new Error("Unsupported table mode");
  }

  return renderTableElement({
    component: props.component.entry.component,
    customProps: props.component.customProps,
    rootField,
    tableMode,
  });
};
