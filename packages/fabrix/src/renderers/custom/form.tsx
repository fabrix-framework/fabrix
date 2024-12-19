import { ComponentRendererProps } from "@customRenderer";
import { Value } from "@fetcher";
import { FormComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { FieldConfigByType } from "@renderers/shared";
import { renderForm } from "@renderers/form";

export const CustomComponentFormRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"form">;
    component: ComponentRendererProps<FormComponentEntry>;
    data: Value;
  },
) =>
  renderForm({
    component: props.component.entry.component,
    customProps: props.component.customProps,
    rootField: {
      name: props.fieldConfig.name,
      fields: props.fieldConfig.configs.fields,
      data: props.data,
      document: props.fieldConfig.document,
    },
  });
