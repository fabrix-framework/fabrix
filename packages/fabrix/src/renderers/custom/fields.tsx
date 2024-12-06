import { FieldsComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { FieldConfigByType } from "@renderers/shared";
import { createElement } from "react";
import { FabrixComponentData } from "@fetcher";

export const FieldsRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<FieldsComponentEntry>;
    data: FabrixComponentData;
  },
) => {
  const field = props.fieldConfig;
  const value = props.data;
  if (value === undefined) {
    throw new Error("Data undefined");
  }
  if (!(field.name in value)) {
    throw new Error("Field not found in data");
  }

  return createElement(props.component.entry.component, {
    name: field.name,
    value,
    customProps: props.component.customProps,
  });
};
