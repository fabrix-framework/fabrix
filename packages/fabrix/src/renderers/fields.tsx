import { createElement, useCallback, useMemo } from "react";
import { ViewFieldSchema } from "@directive/schema";
import { FieldWithDirective } from "@inferer";
import { FabrixContextType } from "@context";
import { useDataFetch, Value } from "../fetcher";
import { RendererCommonProps } from "../renderer";
import {
  assertObjectValue,
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldType,
  getFieldConfigByKey,
  RendererQuery,
  Loader,
  ObjectLikeValue,
  resolveFieldTypesFromTypename,
} from "./shared";

type ViewField = FieldWithDirective<ViewFieldSchema>;

const getTypeName = (
  context: FabrixContextType,
  baseValue: Value | undefined,
  name: string,
) => {
  if (Array.isArray(baseValue)) {
    return resolveFieldTypesFromTypename(context, baseValue[0][name]);
  } else if (typeof baseValue?.[name] === "object") {
    return resolveFieldTypesFromTypename(context, baseValue?.[name]);
  } else {
    return {};
  }
};

/**
 * Get the sub fields of the given field.
 *
 *
 */
const getSubFields = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  query: RendererQuery,
  name: string,
) =>
  // filters fields by parent key and maps the filtered values to the array of SubField
  query.subFields
    .unwrap()
    .filter(
      (f) => f.value.path.getParent()?.asKey() === `${query.rootName}.${name}`,
    )
    .map<SubField>((p) => ({
      path: p.value.path.value,
      name: p.getName(),
      type: getTypeName(context, rootValue, name)[p.getName()],
    }));

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

  const commonRenderFieldProps = useMemo(() => {
    return {
      context,
      renderingData,
      rootName,
      query,
    };
  }, [context, rootName, renderingData, query]);

  const rootValue = renderingData?.[query.rootName];

  // If the query is the one that can be rendered as a table, we will render the table component instead of the fields.
  const tableMode = useMemo(() => {
    if (fieldConfigs.fields.some((f) => f.path.getName() === "collection")) {
      return "standard" as const;
    } else if (fieldConfigs.fields.some((f) => f.path.getName() === "edges")) {
      return "relay" as const;
    }

    return null;
  }, []);

  const rootFieldType = resolveFieldTypesFromTypename(context, rootValue);
  const renderFields = useCallback(() => {
    if (tableMode !== null) {
      return renderTable(context, rootValue, query, tableMode);
    }

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
            subFields: getSubFields(context, rootValue, query, name),
            field: {
              ...field,
              ...extraProps,
            },
          });
        },
      });
    }

    const fieldsComponent = fieldConfigs.fields
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
          subFields: getSubFields(context, rootValue, query, name),
          field,
        });
      });

    return (
      <div className={`fabrix fields col-row ${props.className ?? ""}`}>
        {fieldsComponent}
      </div>
    );
  }, [
    commonRenderFieldProps,
    componentFieldsRenderer,
    fieldConfigs,
    query.rootName,
    rootFieldType,
    getSubFields,
  ]);

  if (fetching) {
    return <Loader />;
  }

  if (error) {
    throw error;
  }

  return renderFields();
};

const renderTable = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  query: RendererQuery,
  tableMode: "standard" | "relay",
) => {
  const renderStandardTable = () => {
    const subFields = getSubFields(context, rootValue, query, "collection");
    const headers = subFields.map((subField) => ({
      key: subField.name,
      label: subField.name,
      type: subField.type,
    }));

    if (!rootValue || !("collection" in rootValue)) {
      return;
    }

    const values = rootValue.collection;
    if (!Array.isArray(values)) {
      return;
    }

    const tableComponent = context.componentRegistry.components.default?.table;
    if (!tableComponent) {
      return;
    }

    return createElement(tableComponent, {
      headers,
      values,
    });
  };

  const renderRelayTable = () => {
    return <div>TODO: Relay Table</div>;
  };

  return (
    <div className={"fabrix table"}>
      {tableMode === "standard" ? renderStandardTable() : renderRelayTable()}
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
