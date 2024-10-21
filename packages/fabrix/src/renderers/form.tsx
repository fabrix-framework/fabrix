import { createElement, useCallback, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "urql";
import { FormFieldSchema } from "@directive/schema";
import { FieldConfigWithMeta } from "@readers/shared";
import { FormFieldExtra } from "@readers/form";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { FabrixContextType } from "../context";
import {
  buildClassName,
  CommonFabrixComponentRendererProps,
  defaultFieldType,
  getFieldConfigByKey,
  Loader,
} from "./shared";
import { buildAjvSchema } from "./form/validation";

const getClearedValue = (values: Record<string, unknown>) =>
  Object.keys(values).reduce((acc, key) => {
    return {
      ...acc,
      [key]: undefined,
    };
  }, {});

export type FormField = FieldConfigWithMeta<FormFieldSchema> & FormFieldExtra;

export const FormRenderer = (
  props: CommonFabrixComponentRendererProps<{
    fields: Array<FormField>;
  }>,
) => {
  const { context, fieldConfigs, query, componentFieldsRenderer } = props;
  const formContext = useForm({
    resolver: ajvResolver(buildAjvSchema(fieldConfigs.fields)),
  });
  const [mutationResult, runMutation] = useMutation(query.documentResolver());
  const runSubmit = formContext.handleSubmit(async (input) => {
    // TODO: sending values should be specifiable by the user through something like `path`
    await runMutation({
      input,
    });

    formContext.reset(getClearedValue(formContext.getValues()));
  });

  const renderFields = useCallback(() => {
    if (componentFieldsRenderer) {
      return componentFieldsRenderer({
        getField: (name, extraProps) => {
          const field = getFieldConfigByKey(fieldConfigs.fields, name);
          if (!field) {
            return null;
          }

          return renderField({
            indexKey: extraProps?.key ?? `${query.rootName}-${name}`,
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

    return fieldConfigs.fields
      .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
      .flatMap((field, fieldIndex) =>
        renderField({
          indexKey: `${query.rootName}-${fieldIndex}`,
          field,
          context,
        }),
      );
  }, [context, fieldConfigs, query.rootName, componentFieldsRenderer]);

  if (context.schemaLoader.status === "loading") {
    return <Loader />;
  }

  const component = context.componentRegistry.components.default?.form;
  if (!component) {
    return;
  }

  return createElement(component, {
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
    className: `fabrix form col-row ${props.className ?? ""}`,
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

  const component = fieldConfig.componentType?.name
    ? context.componentRegistry.getCustom(
        fieldConfig.componentType.name,
        "formField",
      )
    : context.componentRegistry.components.default?.formField;
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
