import { createElement, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { defaultFieldType } from "@renderers/typename";
import { FabrixContextType } from "@context";
import {
  buildClassName,
  CommonFabrixComponentRendererProps,
  FabrixComponentFieldsRenderer,
  FieldConfigByType,
  getFieldConfigByKey,
  Loader,
} from "@renderers/shared";
import { buildAjvSchema } from "./form/validation";
import { ajvResolver } from "./form/ajvResolver";

export type ViewFields = FieldConfigByType<"form">["configs"]["outputFields"];
export type FormField = ViewFields[number];
type FormRendererProps = CommonFabrixComponentRendererProps<ViewFields> & {
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
};

export const FormRenderer = ({
  context,
  rootField,
  componentFieldsRenderer,
  className,
}: FormRendererProps) => {
  const formContext = useForm({
    resolver: ajvResolver(buildAjvSchema(rootField.fields)),
  });
  const runSubmit = formContext.handleSubmit(() => {
    // await onSubmit(input);
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
