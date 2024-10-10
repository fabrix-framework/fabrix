import { TableComponentHeader } from "@registry";
import { BaseFieldSchema } from "@directive/schema";
import { deepmerge } from "deepmerge-ts";
import { FieldTypes } from "./shared";

type CollectionField = {
  config: BaseFieldSchema;
};

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
