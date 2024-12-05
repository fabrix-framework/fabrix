import { FieldsComponentEntry } from "@registry2";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps, FetcherResult } from "@renderer2";
import { FieldConfigByType } from "@renderers/shared";
import { createElement } from "react";

export const FieldsRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<FieldsComponentEntry>;
    fetcherResult: FetcherResult;
  },
) => {
  const field = props.fieldConfig;

  const value = props.fetcherResult.data;
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
