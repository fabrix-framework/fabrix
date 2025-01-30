import { createElement, useCallback } from "react";
import { defaultFieldType } from "@renderers/typename";
import { FabrixContextType } from "@context";
import {
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldConfigByType,
  getFieldConfigByKey,
  Loader,
} from "@renderers/shared";
import { ChildComponentsExtraProps, GetInputFieldsRenderer } from "@renderer";
import { FieldValues, Path, useFormContext } from "react-hook-form";
import { AnyVariables } from "urql";

export type ViewFields = FieldConfigByType<"form">["configs"]["outputFields"];
export type FormField = ViewFields[number];
type FormRendererProps<TVariables extends AnyVariables = AnyVariables> =
  CommonFabrixComponentRendererProps<ViewFields> & {
    executeQuery: () => Promise<void>;
    fieldsRenderer?: GetInputFieldsRenderer<TVariables>;
  };

export const FormRenderer = <TVariables extends AnyVariables = AnyVariables>({
  context,
  rootField,
  executeQuery,
  fieldsRenderer,
  className,
}: FormRendererProps<TVariables>) => {
  const formContext =
    useFormContext<TVariables extends FieldValues ? TVariables : FieldValues>();

  const field = {
    handler: (
      name: Path<TVariables extends FieldValues ? TVariables : FieldValues>,
    ) => ({
      ...formContext.register(name),
    }),
    component: (name: string, extraProps?: ChildComponentsExtraProps) => {
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
          config: {
            ...field.config,
            ...extraProps,
          },
        },
        context,
      });
    },
  };

  const action = {
    handler: {
      getState: useCallback(
        () => formContext.formState,
        [formContext.formState],
      ),
      onClick: executeQuery,
    },
    component: () => <button onClick={() => executeQuery()}>Submit</button>,
  };

  const renderFields = useCallback(
    () =>
      rootField.fields
        .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
        .flatMap((field, fieldIndex) =>
          renderField({
            indexKey: `${rootField.name}-${fieldIndex}`,
            field,
            context,
          }),
        ),
    [context, rootField.name, fieldsRenderer],
  );

  if (context.schemaLoader.status === "loading") {
    return <Loader />;
  }

  const component = context.componentRegistry.getDefaultComponentByType("form");
  if (!component) {
    return;
  }

  if (fieldsRenderer) {
    return fieldsRenderer({
      formContext,
      getAction: () => action.handler,
      Field: (props: {
        name: string;
        extraProps?: ChildComponentsExtraProps;
      }) => field.component(props.name, props.extraProps),
      getField: (
        name: Path<TVariables extends FieldValues ? TVariables : FieldValues>,
      ) => field.handler(name),
    });
  }

  return createElement(component, {
    name: rootField.name,
    className: `fabrix form col-row ${className ?? ""}`,
    customProps: {},
    renderFields,
    renderField: field.component,
    getAction: () => action.handler,
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
