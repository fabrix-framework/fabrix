import { FabrixContext } from "@context";
import { FormComponentEntry } from "@registry";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps } from "@customRenderer";
import { renderFormField } from "@renderers/form";
import { ajvResolver } from "@renderers/form/ajvResolver";
import { buildAjvSchema } from "@renderers/form/validation";
import { FieldConfigByType, Loader } from "@renderers/shared";
import { createElement, useContext } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "urql";

export const FormRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"form">;
    component: ComponentRendererProps<FormComponentEntry>;
  },
) => {
  const { query } = props;
  const context = useContext(FabrixContext);
  const formContext = useForm({
    resolver: ajvResolver(buildAjvSchema(props.fieldConfig.configs.fields)),
  });
  const [mutationResult, runMutation] = useMutation(query);
  const runSubmit = formContext.handleSubmit(async (input) => {
    // TODO: sending values should be specifiable by the user through something like `path`
    await runMutation({
      input,
    });

    formContext.reset();
  });

  if (context.schemaLoader.status === "loading") {
    return <Loader />;
  }

  const renderFields = () =>
    props.fieldConfig.configs.fields
      .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
      .flatMap((field, fieldIndex) =>
        renderFormField({
          indexKey: `${props.fieldConfig.name}-${fieldIndex}`,
          field,
          context,
        }),
      );

  return createElement(props.component.entry.component, {
    name: props.fieldConfig.name,
    className: "fabrix form",
    renderFields: () => (
      <FormProvider {...formContext}>{renderFields()}</FormProvider>
    ),
    renderSubmit: (submitRenderer) =>
      submitRenderer({
        submit: runSubmit,
        isSubmitting: mutationResult.fetching,
      }),
    renderReset: (resetRenderer) =>
      resetRenderer({ reset: () => formContext.reset() }),
    customProps: props.component.customProps,
  });
};
