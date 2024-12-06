import { createElement, useCallback, useContext, useMemo } from "react";
import { FabrixContext, FabrixContextType } from "@context";
import { Value } from "../fetcher";
import {
  assertObjectValue,
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldConfigByType,
  getFieldConfigByKey,
  resolveFieldTypesFromTypename,
} from "./shared";

export type ViewFields = FieldConfigByType<"view">["configs"]["fields"];
type ViewField = ViewFields[number];

export const ViewRenderer = ({
  context,
  rootField,
  componentFieldsRenderer,
  className,
}: CommonFabrixComponentRendererProps<ViewFields>) => {
  // If the query is the one that can be rendered as a table, we will render the table component instead of the fields.
  const tableType = useMemo(() => getTableType(rootField.fields), [rootField]);

  const renderFields = useCallback(() => {
    if (componentFieldsRenderer) {
      return componentFieldsRenderer({
        getField: (name, extraProps) => {
          const field = getFieldConfigByKey(rootField.fields, name);
          if (!field) {
            return null;
          }

          return renderField({
            rootField,
            extraClassName: extraProps?.className,
            indexKey: extraProps?.key ?? `${rootField.name}-${name}`,
            subFields: getSubFields(
              context,
              rootField.data,
              rootField.fields,
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

    const fieldsComponent = rootField.fields
      .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
      .flatMap((field, fieldIndex) => {
        const name = field.field.getName();
        if (name.startsWith("_")) {
          // Ignore __typename
          return [];
        }

        return renderField({
          rootField,
          indexKey: `${rootField.name}-${fieldIndex}`,
          subFields: getSubFields(
            context,
            rootField.data,
            rootField.fields,
            name,
          ),
          field,
        });
      });

    return (
      <div className={`fabrix fields col-row ${className ?? ""}`}>
        {fieldsComponent}
      </div>
    );
  }, [componentFieldsRenderer, rootField, getSubFields]);

  return tableType !== null
    ? renderTable(context, rootField, tableType)
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
 *
 * This also sorts the fields by the index value.
 */
export const getSubFields = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  fields: ViewFields,
  name: string,
) =>
  // filters fields by parent key and maps the filtered values to the array of SubField
  fields
    .filter((f) => f.field.getParent()?.asKey() === name)
    .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
    .map((value) => ({
      value,
      type:
        getTypeName(context, rootValue, name)[value.field.getName()] || null,
      label: value.config.label || value.field.getName(),
    }));

const tableModes = {
  standard: "collection",
  relay: "edges",
} as const;
type TableMode = keyof typeof tableModes;
export const getTableType = (fields: ViewFields) => {
  const modeKeyFields = Object.values(tableModes) as string[];
  const keyField = fields.find((f) =>
    modeKeyFields.includes(f.field.getName()),
  );
  if (!keyField) {
    return null;
  }
  return keyField.field.getName() == "collection" ? "standard" : "relay";
};
const getTableValues = (
  rootValue: Value,
  mode: TableMode,
): Record<string, unknown>[] => {
  const value = rootValue as Record<string, unknown>;
  switch (mode) {
    case "standard":
      return value.collection as Record<string, unknown>[];
    case "relay":
      return (value.edges as { node: Record<string, unknown> }[]).map(
        ({ node }) => node,
      );
  }
};

const renderTable = (
  context: FabrixContextType,
  rootValue: Value | undefined,
  fields: ViewFields,
  tableMode: TableMode,
) => {
  if (!rootValue) {
    return;
  }

  const values = getTableValues(rootValue, tableMode);

  const renderTableContent = () => {
    const subFields = getSubFields(
      context,
      rootValue,
      fields,
      tableMode == "standard" ? "collection" : "edges.node",
    );

    const tableComponent =
      context.componentRegistry.getDefaultComponentByType("table");
    if (!tableComponent) {
      return;
    }

    return createElement(tableComponent, {
      name,
      headers: buildHeaders(context, subFields),
      values,
      customProps: {},
    });
  };

  return <div className={"fabrix table"}>{renderTableContent()}</div>;
};

export const buildHeaders = (
  context: FabrixContextType,
  subFields: SubFields,
) =>
  subFields.flatMap((subField) => {
    if (subField.value.config.hidden) {
      return [];
    }

    const component =
      context.componentRegistry.getCustomComponentByNameWithFallback(
        subField.value.config.componentType?.name,
        "tableCell",
      );

    const userProps = subField.value.config.componentType?.props?.reduce(
      (acc, prop) => {
        return {
          ...acc,
          [prop.name]: prop.value,
        };
      },
      {},
    );

    const key = subField.value.field.getName();
    const cellRenderer = component
      ? (rowValue: Record<string, unknown>) => {
          return createElement(component, {
            key,
            name: key,
            path: subField.value.field.value,
            type: subField.type,
            value: rowValue,
            subFields: subFields.map((subField) => ({
              key: subField.value.field.getName(),
              label: subField.label,
              type: subField.type,
            })),
            attributes: {
              className: "",
              label: subField.label,
            },
            userProps,
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

export type SubField = ReturnType<typeof getSubFields>[number];
export type SubFields = Array<SubField>;

type RenderFieldProps = {
  rootField: CommonFabrixComponentRendererProps<ViewFields>["rootField"];
  indexKey: string;
  field: ViewField;
  subFields: SubFields;
  extraClassName?: string;
};
const renderField = ({
  rootField,
  field,
  subFields,
  indexKey,
  extraClassName,
}: RenderFieldProps) => {
  const context = useContext(FabrixContext);
  if (field.config.hidden) {
    return;
  }

  const fieldName = field.field.getName();
  const fieldType = rootField.type?.[fieldName];

  assertObjectValue(rootField.data);

  const component =
    context.componentRegistry.getCustomComponentByNameWithFallback(
      field.config.componentType?.name,
      "field",
    );
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
    key: indexKey,
    name: field.field.asKey(),
    path: field.field.value,
    value: rootField.data?.[fieldName] ?? "-",
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
