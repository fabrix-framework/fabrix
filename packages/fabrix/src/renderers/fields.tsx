import { createElement, useMemo } from "react";
import { FabrixContextType } from "@context";
import { Value } from "@fetcher";
import { get } from "es-toolkit/compat";
import {
  ChildComponentsExtraProps,
  GetOutputFieldsRendererProps,
  RootFieldName,
} from "@renderer";
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
  buildTypenameExtractor,
  FieldType,
  TypenameExtractor,
} from "./typename";

export type ViewFields = FieldConfigByType<"view">["configs"]["outputFields"];
type ViewField = ViewFields[number];
type ViewRendererProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = CommonFabrixComponentRendererProps<ViewFields> & {
  data: Value | undefined;
  fieldsRenderer?: (
    props: GetOutputFieldsRendererProps<TData>,
  ) => React.ReactNode;
};

export const ViewRenderer = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
>(
  props: ViewRendererProps<TData>,
) => {
  const { context, rootField, fieldsRenderer, className, fetching } = props;

  // If the query is the one that can be rendered as a table, we will render the table component instead of the fields.
  const tableType = useMemo(() => getTableMode(rootField.fields), [rootField]);

  const schema = context.schemaLoader;
  if (schema.status === "loading") {
    return <Loader />;
  }

  const typenameExtractor = buildTypenameExtractor({
    targetValue: props.data,
    schemaSet: schema.schemaSet,
  });

  const field = {
    component: (name: string, extraProps?: ChildComponentsExtraProps) => {
      const field = getFieldConfigByKey(rootField.fields, name);
      if (!field) {
        return null;
      }

      return renderField({
        context,
        data: props.data,
        extraClassName: extraProps?.className,
        indexKey: extraProps?.key ?? `${rootField.name}-${name}`,
        subFields: getSubFields(typenameExtractor, rootField.fields, name),
        field: {
          ...field,
          ...extraProps,
          config: {
            ...field.config,
            ...extraProps,
          },
        },
        fieldType: typenameExtractor.getFieldTypeByPath(field.field),
      });
    },
  };

  const fieldsComponent = rootField.fields
    .sort((a, b) => (a.config.index ?? 0) - (b.config.index ?? 0))
    .flatMap((field, fieldIndex) => {
      const name = field.field.getName();
      if (name.startsWith("_")) {
        // Ignore __typename
        return [];
      }

      return renderField({
        context,
        data: props.data,
        indexKey: `${rootField.name}-${fieldIndex}`,
        subFields: getSubFields(typenameExtractor, rootField.fields, name),
        field,
        fieldType: typenameExtractor.getFieldTypeByPath(field.field),
      });
    });

  if (fetching) {
    return <Loader />;
  }

  if (fieldsRenderer) {
    return fieldsRenderer({
      data: props.data as TData extends Record<string, unknown>
        ? TData[RootFieldName<TData>]
        : Record<string, unknown>,
      Field: ({ name }) => field.component(name),
    });
  }

  return tableType !== null ? (
    <div className={`fabrix fields ${className ?? ""}`}>
      {renderTable(
        context,
        {
          name: rootField.name,
          data: props.data,
          fields: rootField.fields,
        },
        tableType,
      )}
    </div>
  ) : (
    <div className={`fabrix fields col-row ${className ?? ""}`}>
      {fieldsComponent}
    </div>
  );
};

/**
 * Get the sub fields of the given field.
 *
 * This also sorts the fields by the index value.
 */
export const getSubFields = (
  typenameExtractor: TypenameExtractor,
  fields: ViewFields,
  name: string,
) =>
  // filters fields by parent key and maps the filtered values to the array of SubField
  fields
    .filter((f) => {
      const parentKey = f.field.getParent()?.asKey();
      return parentKey === name || parentKey?.startsWith(`${name}.`);
    })
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
  context: FabrixContextType;
  data: Value | undefined;
  indexKey: string;
  field: ViewField;
  fieldType: FieldType;
  subFields: SubFields;
  extraClassName?: string;
};
const renderField = ({
  context,
  data,
  field,
  fieldType,
  subFields,
  indexKey,
  extraClassName,
}: RenderFieldProps) => {
  if (field.config.hidden) {
    return;
  }

  assertObjectValue(data);

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
  const name = field.field.asKey();
  return createElement(component, {
    key: indexKey,
    name,
    path: field.field.value,
    value: get(data, name),
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
