import { createElement, useCallback, useMemo } from "react";
import { ViewFieldSchema } from "@directive/schema";
import { FieldWithDirective } from "@inferer";
import { useDataFetch, Value } from "../fetcher";
import { RendererCommonProps } from "../renderer";
import {
  assertObjectValue,
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldType,
  FieldTypes,
  getFieldConfigByKey,
  ObjectLikeValue,
  resolveFieldTypesFromTypename,
} from "./shared";

type ViewField = FieldWithDirective<ViewFieldSchema>;

export const ViewRenderer = (
  props: CommonFabrixComponentRendererProps<{
    fields: Array<ViewField>;
  }>,
) => {
  const { context, fieldConfigs, query, defaultData, componentFieldsRenderer } =
    props;
  const { rootName, documentResolver, variables } = query;
  const {
    fetching,
    error,
    data: renderingData,
  } = useDataFetch({
    query: documentResolver(),
    variables,
    defaultData,
  });

  const resolveFieldType = useCallback(
    (value: ObjectLikeValue): FieldTypes =>
      resolveFieldTypesFromTypename(context, value),
    [context],
  );

  const commonRenderFieldProps = useMemo(() => {
    return {
      context,
      renderingData,
      rootName,
      query,
    };
  }, [context, rootName, renderingData, query]);

  const filterSubFieldsByParent = useCallback(
    (ckey: string) =>
      query.subFields
        .unwrap()
        .filter(
          (f) =>
            f.value.path.getParent()?.asKey() === `${query.rootName}.${ckey}`,
        ),
    [query],
  );

  const rootValue = renderingData?.[query.rootName];
  const getTypeName = useCallback(
    (baseValue: Value | undefined, name: string) => {
      if (Array.isArray(baseValue)) {
        return resolveFieldType(baseValue[0][name]);
      } else if (typeof baseValue?.[name] === "object") {
        return resolveFieldType(baseValue?.[name]);
      } else {
        return {};
      }
    },
    [resolveFieldType],
  );

  const buildSubFields = useCallback(
    (name: string) =>
      filterSubFieldsByParent(name).map<SubField>((p) => ({
        path: p.value.path.value,
        name: p.getName(),
        type: getTypeName(rootValue, name)[p.getName()],
      })),
    [filterSubFieldsByParent, getTypeName, rootValue],
  );

  const rootFieldType = resolveFieldType(rootValue);
  const renderFields = useCallback(() => {
    if (componentFieldsRenderer) {
      return componentFieldsRenderer({
        getField: (name, extraProps) => {
          const field = getFieldConfigByKey(fieldConfigs.fields, name);
          if (!field) {
            return null;
          }

          return renderField({
            ...commonRenderFieldProps,
            extraClassName: extraProps?.className,
            indexKey: extraProps?.key ?? `${query.rootName}-${name}`,
            fieldTypes: rootFieldType,
            subFields: buildSubFields(name),
            field: {
              ...field,
              ...extraProps,
            },
          });
        },
      });
    }

    return fieldConfigs.fields
      .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
      .flatMap((field, fieldIndex) => {
        const name = field.path.getName();
        if (name.startsWith("_")) {
          // Ignore __typename
          return [];
        }

        return renderField({
          ...commonRenderFieldProps,
          indexKey: `${query.rootName}-${fieldIndex}`,
          fieldTypes: rootFieldType,
          subFields: buildSubFields(name),
          field,
        });
      });
  }, [
    commonRenderFieldProps,
    componentFieldsRenderer,
    fieldConfigs,
    query.rootName,
    rootFieldType,
    buildSubFields,
  ]);

  if (fetching) {
    return <div>Loading...</div>;
  }

  if (error) {
    throw error;
  }

  return (
    <div className={`fabrix fields col-row ${props.className ?? ""}`}>
      {renderFields()}
    </div>
  );
};

export type SubField = {
  name: string;
  path: Array<string>;
  type: FieldType;
};

const renderField = (
  props: RendererCommonProps & {
    indexKey: string;
    field: ViewField;
    subFields: Array<SubField>;
  },
) => {
  const {
    context,
    field,
    subFields,
    fieldTypes,
    renderingData,
    extraClassName,
  } = props;
  if (field.config.hidden) {
    return;
  }

  const fieldName = field.path.getName();
  const values = renderingData?.[props.query.rootName];
  const fieldType = fieldTypes?.[fieldName];

  assertObjectValue(values);

  const component = field.config.componentType?.name
    ? context.componentRegistry.getCustom(
        field.config.componentType.name,
        "field",
      )
    : context.componentRegistry.components.default?.field;
  if (!component) {
    return;
  }

  const userProps = field.config.componentType?.props?.reduce((acc, prop) => {
    return {
      ...acc,
      [prop.name]: prop.value,
    };
  }, {});

  const className = buildClassName(field.config, extraClassName);
  return createElement(component, {
    key: props.indexKey,
    name: field.path.asKey(),
    value: values?.[fieldName] ?? "-",
    type: fieldType,
    subFields,
    attributes: {
      className,
      label: field.config.label,
    },
    userProps,
  });
};
