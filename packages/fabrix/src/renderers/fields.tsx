import { createElement, useCallback, useContext, useMemo } from "react";
import { FabrixContext } from "@context";
import { Value } from "@fetcher";
import {
  assertObjectValue,
  buildClassName,
  CommonFabrixComponentRendererProps,
  FieldConfigByType,
  getFieldConfigByKey,
  Loader,
} from "./shared";
import { getTableMode, renderTable } from "./table";
import {
  FieldType,
  TypenameExtractor,
  buildTypenameExtractor,
} from "./typename";

export type ViewFields = FieldConfigByType<"view">["configs"]["fields"];
type ViewField = ViewFields[number];

export const ViewRenderer = ({
  context,
  rootField,
  componentFieldsRenderer,
  className,
}: CommonFabrixComponentRendererProps<ViewFields>) => {
  // If the query is the one that can be rendered as a table, we will render the table component instead of the fields.
  const tableType = useMemo(() => getTableMode(rootField.fields), [rootField]);

  const renderFields = useCallback(() => {
    const schema = context.schemaLoader;
    if (schema.status === "loading") {
      return <Loader />;
    }

    const typenameExtractor = buildTypenameExtractor({
      targetValue: rootField.data,
      schemaSet: schema.schemaSet,
    });

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
            subFields: getSubFields(typenameExtractor, rootField.fields, name),
            field: {
              ...field,
              ...extraProps,
            },
            fieldType: typenameExtractor.getFieldTypeByPath(field.field),
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
          subFields: getSubFields(typenameExtractor, rootField.fields, name),
          field,
          fieldType: typenameExtractor.getFieldTypeByPath(field.field),
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
 * Get the sub fields of the given field.
 *
 * This also sorts the fields by the index value.
 */
export const getSubFields = (
  // context: FabrixContextType,
  typenameExtractor: TypenameExtractor,
  fields: ViewFields,
  name: string,
) =>
  // filters fields by parent key and maps the filtered values to the array of SubField
  fields
    .filter((f) => f.field.getParent()?.asKey().startsWith(name))
    .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
    .map((value) => ({
      value,
      type: typenameExtractor.getFieldTypeByPath(value.field),
      label: value.config.label || value.field.getName(),
    }));

export type RootField = {
  name: string;
  data: Value | undefined;
  fields: ViewFields;
};

export type SubField = ReturnType<typeof getSubFields>[number];
export type SubFields = Array<SubField>;

type RenderFieldProps = {
  rootField: CommonFabrixComponentRendererProps<ViewFields>["rootField"];
  indexKey: string;
  field: ViewField;
  fieldType: FieldType;
  subFields: SubFields;
  extraClassName?: string;
};
const renderField = ({
  rootField,
  field,
  fieldType,
  subFields,
  indexKey,
  extraClassName,
}: RenderFieldProps) => {
  const context = useContext(FabrixContext);
  if (field.config.hidden) {
    return;
  }

  assertObjectValue(rootField.data);

  const component = context.componentRegistry.getCustomComponent(
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
    value: rootField.data?.[field.field.getName()] ?? "-",
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
