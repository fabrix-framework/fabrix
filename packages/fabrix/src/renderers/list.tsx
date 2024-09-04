import { TableComponentHeader } from "@registry";
import { BaseFieldSchema } from "@directive/schema";
import { deepmerge } from "deepmerge-ts";
import { FieldTypes } from "./shared";

type CollectionField = {
  config: BaseFieldSchema;
};

/*
export const ListRenderer = (
  props: CommonFabrixComponentRendererProps<{
    path: string;
    fields: Record<string, CollectionField>;
  }>,
) => {
  const {
    context,
    fieldConfigs,
    queryName,
    queryResolver,
    variables,
    defaultData,
  } = props;
  const {
    fetching,
    error,
    data: renderingData,
  } = useDataFetch({
    query: queryResolver(),
    variables,
    defaultData,
  });

  if (fetching) {
    return <div>Loading...</div>;
  }

  if (error) {
    throw error;
  }

  const valueRoot = renderingData?.[queryName];
  if (!valueRoot) {
    return;
  }

  const component = context.componentRegistry.components.default?.table;
  if (!component) {
    return;
  }

  const values: unknown = JSONPath({
    flatten: true,
    path: fieldConfigs?.path ?? "$.collection",
    json: valueRoot,
  });

  assertArrayValue(values);

  if (values.length === 0) {
    return <div>No data</div>;
  }

  const headerTypes = resolveFieldTypesFromTypename(context, values);
  const headers = inferredHeadersWithOrder(
    fieldConfigs?.fields,
    headerTypes,
    values,
  );
  return createElement(
    "div",
    { className: `fabrix collection ${props.className ?? ""}` },
    createElement(component, {
      name: queryName,
      values: values,
      headers,
    }),
  );
};
*/

/**
 *  A helper function to infer table headers from the data.
 *
 *  If the fields are provided in the directive, it will use the fields as headers.
 *  Otherwise, it will use the keys of the first object in the data as headers.
 */
export const inferredHeadersWithOrder = (
  fields: Record<string, CollectionField> | undefined,
  headerType: FieldTypes,
  values: Array<Record<string, unknown>>,
): Array<TableComponentHeader> => {
  if (values.length === 0) {
    return [];
  }

  const selectedFields = Object.keys(values[0]).flatMap((key, index) => {
    if (key.startsWith("_")) {
      // Ignore __typename
      return [];
    }

    return {
      key,
      label: key,
      index,
      type: headerType[key] ?? null,
    };
  });

  const fieldsKeys = Object.keys(fields ?? {});
  if (fieldsKeys.length === 0) {
    return selectedFields;
  }

  const fieldsOnArguments = fieldsKeys.map((key) => {
    const label = fields?.[key]?.config.label ?? key;
    const index = fields?.[key]?.config.index;

    return {
      key,
      label,
      index,
    };
  });

  return selectedFields
    .map((field) => {
      const targetField = fieldsOnArguments.find(
        (header) => header.key === field.key,
      );
      return targetField ? deepmerge(field, targetField) : field;
    })
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
};
