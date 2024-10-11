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
  getFieldConfigByKey,
  Loader,
  resolveFieldTypesFromTypename,
} from "./shared";

type ViewField = FieldWithDirective<ViewFieldSchema>;
type Fields = Array<ViewField>;

export const ViewRenderer = (
  props: CommonFabrixComponentRendererProps<{
    fields: Fields;
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
  const tableType = useMemo(() => {
    if (fieldConfigs.fields.some((f) => f.field.getName() === "collection")) {
      return "standard" as const;
    } else if (fieldConfigs.fields.some((f) => f.field.getName() === "edges")) {
      return "relay" as const;
    }

    return null;
  }, []);

  const rootFieldType = resolveFieldTypesFromTypename(context, rootValue);
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
            subFields: getSubFields(
              context,
              rootValue,
              fieldConfigs.fields,
              name,
            ),
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
        const name = field.field.getName();
        if (name.startsWith("_")) {
          // Ignore __typename
          return [];
        }

        return renderField({
          ...commonRenderFieldProps,
          indexKey: `${query.rootName}-${fieldIndex}`,
          fieldTypes: rootFieldType,
          subFields: getSubFields(
            context,
            rootValue,
            fieldConfigs.fields,
            name,
          ),
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

  return tableType !== null
    ? renderTable(context, rootValue, fieldConfigs.fields, tableType)
    : renderFields();
};

/**
 * Get the type name of the given field by looking at the __typename field.
 */
const getTypeName = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  name: string,
) => {
  if (Array.isArray(rootValue)) {
    return resolveFieldTypesFromTypename(context, rootValue[0][name]);
  } else if (typeof rootValue?.[name] === "object") {
    return resolveFieldTypesFromTypename(context, rootValue?.[name]);
  } else {
    return {};
  }
};

/**
 * Get the sub fields of the given field.
 */
const getSubFields = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  fields: Fields,
  name: string,
) =>
  // filters fields by parent key and maps the filtered values to the array of SubField
  fields
    .filter((f) => f.field.getParent()?.asKey() === name)
    .map((value) => ({
      value,
      type:
        getTypeName(context, rootValue, name)[value.field.getName()] || null,
      label: value.config.label || value.field.getName(),
    }));

const renderTable = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  fields: Fields,
  tableMode: "standard" | "relay",
) => {
  if (!rootValue || !("collection" in rootValue)) {
    return;
  }

  const values = rootValue.collection;
  if (!Array.isArray(values)) {
    return;
  }

  const renderStandardTable = () => {
    const subFields = getSubFields(context, rootValue, fields, "collection");
    const headers = subFields.map((subField) => {
      // TODO: fallback to default table cell component
      const component = subField.value.config.componentType?.name
        ? context.componentRegistry.getCustom(
            subField.value.config.componentType.name,
            "tableCell",
          )
        : null;

      const key = subField.value.field.getName();
      const cellRenderer = component
        ? (value: unknown) => {
            return createElement(component, {
              key,
              name: key,
              type: null,
              value,
              attributes: {
                className: "",
                label: subField.label,
              },
            });
          }
        : null;

      return {
        label: subField.label,
        key: subField.value.field.getName(),
        type: subField.type,
        render: cellRenderer,
      };
    });

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

  const headerConfig = getFieldConfigByKey(fields, "collection");
  return (
    <div className={"fabrix table"}>
      {headerConfig && (
        <h2 className={"fabrix table-title"}>{headerConfig.config.label}</h2>
      )}
      {tableMode === "standard" ? renderStandardTable() : renderRelayTable()}
    </div>
  );
};

export type SubField = ReturnType<typeof getSubFields>[number];

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

  const fieldName = field.field.getName();
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
    name: field.field.asKey(),
    value: values?.[fieldName] ?? "-",
    type: fieldType,
    subFields: subFields.map((subField) => ({
      key: subField.value.field.getName(),
      label: subField.label,
      type: subField.type,
    })),
    attributes: {
      className,
      label: field.config.label,
    },
    userProps,
  });
};
