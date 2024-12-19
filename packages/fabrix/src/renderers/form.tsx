import { createElement, useContext } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "urql";
import { DocumentNode } from "graphql";
import { FabrixContext, FabrixContextType } from "@context";
import { FormComponentEntry } from "@registry";
import {
  buildClassName,
  CommonFabrixComponentRendererProps,
  defaultFieldType,
  FabrixComponentFieldsRenderer,
  FieldConfigByType,
  getFieldConfigByKey,
  Loader,
} from "./shared";
import { buildAjvSchema } from "./form/validation";
import { ajvResolver } from "./form/ajvResolver";
import { RootField } from "./fields";

export type FormFields = FieldConfigByType<"form">["configs"]["fields"];
export type FormField = FormFields[number];

export const DefaultFormRenderer = (
  props: CommonFabrixComponentRendererProps<FormFields>,
) => {
  const context = useContext(FabrixContext);
  const component = context.componentRegistry.getDefaultComponentByType("form");
  if (!component) {
    return;
  }

  return renderForm({
    ...props,
    component,
    customProps: {},
  });
};

export const renderForm = (props: {
  component: FormComponentEntry["component"];
  customProps: unknown;
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
  className?: string;
  rootField: RootField & {
    document: DocumentNode;
  };
}) => {
  const {
    component,
    customProps,
    componentFieldsRenderer,
    className,
    rootField,
  } = props;
  const context = useContext(FabrixContext);
  const formContext = useForm({
    resolver: ajvResolver(buildAjvSchema(rootField.fields)),
  });
  const [mutationResult, runMutation] = useMutation(rootField.document);
  const runSubmit = formContext.handleSubmit(async (input) => {
    // TODO: sending values should be specifiable by the user through something like `path`
    await runMutation({ input });

    formContext.reset();
  });

  if (context.schemaLoader.status === "loading") {
    return <Loader />;
  }

  return createElement(component, {
    name: rootField.name,
    renderFields: () => {
      return (
        <FormProvider {...formContext}>
          {renderFormFields({
            ...rootField,
            componentFieldsRenderer,
            className,
          })}
        </FormProvider>
      );
    },
    renderSubmit: (submitRenderer) =>
      submitRenderer({
        submit: runSubmit,
        isSubmitting: mutationResult.fetching,
      }),
    renderReset: (resetRenderer) =>
      resetRenderer({ reset: () => formContext.reset() }),
    className: `fabrix form col-row ${className ?? ""}`,
    customProps,
  });
};

export const renderFormFields = (props: {
  name: string;
  fields: FormFields;
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
  className?: string;
}) => {
  const context = useContext(FabrixContext);
  const { name, fields, componentFieldsRenderer } = props;

  if (componentFieldsRenderer) {
    return componentFieldsRenderer({
      getField: (fieldName, extraProps) => {
        const field = getFieldConfigByKey(fields, fieldName);
        if (!field) {
          return null;
        }

        return renderFormField({
          indexKey: extraProps?.key ?? `${name}-${fieldName}`,
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

  return fields
    .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
    .flatMap((field, fieldIndex) =>
      renderFormField({
        indexKey: `${name}-${fieldIndex}`,
        field,
        context,
      }),
    );
};

const renderFormField = (props: {
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
