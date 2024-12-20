import { createElement, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "urql";
import { FabrixContextType } from "../context";
import {
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldConfigByType,
  getFieldConfigByKey,
  Loader,
} from "./shared";
import { buildAjvSchema } from "./form/validation";
import { ajvResolver } from "./form/ajvResolver";
import { defaultFieldType } from "./typename";

export type FormFields = FieldConfigByType<"form">["configs"]["fields"];
export type FormField = FormFields[number];

export const FormRenderer = ({
  context,
  rootField,
  componentFieldsRenderer,
  className,
}: CommonFabrixComponentRendererProps<FormFields>) => {
  const formContext = useForm({
    resolver: ajvResolver(buildAjvSchema(rootField.fields)),
  });
  const [mutationResult, runMutation] = useMutation(rootField.document);
  const runSubmit = formContext.handleSubmit(async (input) => {
    // TODO: sending values should be specifiable by the user through something like `path`
    await runMutation({ input });

    formContext.reset();
  });

  const renderFields = useCallback(() => {
    if (componentFieldsRenderer) {
      return componentFieldsRenderer({
        getField: (name, extraProps) => {
          const field = getFieldConfigByKey(rootField.fields, name);
          if (!field) {
            return null;
          }

          return renderField({
            indexKey: extraProps?.key ?? `${rootField.name}-${name}`,
            extraClassName: extraProps?.className,
            field: {
              ...field,
              ...extraProps,
            },
            context,
          });
        },
      });
    }

    return rootField.fields
      .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
      .flatMap((field, fieldIndex) =>
        renderField({
          indexKey: `${rootField.name}-${fieldIndex}`,
          field,
          context,
        }),
      );
  }, [context, rootField.name, componentFieldsRenderer]);

  if (context.schemaLoader.status === "loading") {
    return <Loader />;
  }

  const component = context.componentRegistry.getDefaultComponentByType("form");
  if (!component) {
    return;
  }

  return createElement(component, {
    name: rootField.name,
    renderFields: () => {
      return <FormProvider {...formContext}>{renderFields()}</FormProvider>;
    },
    renderSubmit: (submitRenderer) =>
      submitRenderer({
        submit: runSubmit,
        isSubmitting: mutationResult.fetching,
      }),
    renderReset: (resetRenderer) =>
      resetRenderer({ reset: () => formContext.reset() }),
    className: `fabrix form col-row ${className ?? ""}`,
    customProps: {},
  });
};

const renderField = (props: {
  indexKey: string;
  field: FormField;
  context: FabrixContextType;
  extraClassName?: string;
}) => {
  const { context, field, indexKey, extraClassName } = props;
  const fieldConfig = field.config;
  if (fieldConfig.hidden) {
    return;
  }

  const component = context.componentRegistry.getCustomComponent(
    fieldConfig.componentType?.name,
    "formField",
  );
  if (!component) {
    return;
  }

  const userProps = fieldConfig.componentType?.props?.reduce((acc, prop) => {
    return {
      ...acc,
      [prop.name]: prop.value,
    };
  }, {});

  const className = buildClassName(fieldConfig, extraClassName);
  return createElement(component, {
    key: indexKey,
    value: fieldConfig.defaultValue,
    type: field.meta?.fieldType ?? defaultFieldType,
    name: field.field.asKey(),
    isRequired: field.meta?.isRequired ?? false,
    attributes: {
      className,
      label: fieldConfig.label,
    },
    userProps,
  });
};
