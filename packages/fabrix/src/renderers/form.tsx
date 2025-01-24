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

export type ViewFields = FieldConfigByType<"form">["configs"]["outputFields"];
export type FormField = ViewFields[number];
type FormRendererProps = CommonFabrixComponentRendererProps<ViewFields> & {
  executeQuery: () => Promise<void>;
  fieldsRenderer?: GetInputFieldsRenderer;
};

export const FormRenderer = ({
  context,
  rootField,
  executeQuery,
  fieldsRenderer,
  className,
}: FormRendererProps) => {
  const field = {
    handler: {
      // TODO: inject value here
      value: null,
      onChange: () => void 0,
    },
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
        },
        context,
      });
    },
  };

  const action = {
    handler: {
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

  return createElement(component, {
    name: rootField.name,
    className: `fabrix form col-row ${className ?? ""}`,
    customProps: {},
    children:
      fieldsRenderer &&
      fieldsRenderer({
        Action: action.component,
        getAction: () => action.handler,
        Field: (props: { name: string }) => field.component(props.name),
        getField: () => field.handler,
      }),
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
