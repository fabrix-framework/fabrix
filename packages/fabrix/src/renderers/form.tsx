import { createElement, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "urql";
import { FormFieldSchema } from "@directive/schema";
import { FieldWithDirective } from "@inferer";
import { FabrixContextType } from "../context";
import {
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldType,
  getFieldConfigByKey,
} from "./shared";

const getClearedValue = (values: Record<string, unknown>) =>
  Object.keys(values).reduce((acc, key) => {
    return {
      ...acc,
      [key]: null,
    };
  }, {});

export type FormFieldMeta = {
  fieldType: FieldType;
  isRequired: boolean;
};

export type FormField = FieldWithDirective<FormFieldSchema, FormFieldMeta>;

export const FormRenderer = (
  props: CommonFabrixComponentRendererProps<{
    fields: Array<FormField>;
  }>,
) => {
  const { context, fieldConfigs, query, componentFieldsRenderer } = props;
  const formContext = useForm();
  const [mutationResult, runMutation] = useMutation(query.documentResolver());
  const component = context.componentRegistry.components.default?.form;
  if (!component) {
    return;
  }

  const runSubmit = useCallback(() => {
    runMutation({
      // TODO: here should be specifiable by the user through `path`
      input: formContext.getValues(),
    })
      .then(() => {
        formContext.reset(getClearedValue(formContext.getValues()));
      })
      .catch((error) => {
        throw error;
      });
  }, [formContext, runMutation]);

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
    type: field.meta.fieldType,
    name: field.path.asKey(),
    isRequired: field.meta.isRequired,
    attributes: {
      className,
      label: fieldConfig.label,
    },
    userProps,
  });
};
