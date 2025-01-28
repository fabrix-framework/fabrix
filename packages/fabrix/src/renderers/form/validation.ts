import { FormField, FormFields } from "@renderers/form";
import { JSONSchemaType } from "ajv";

const convertToAjvProperty = (field: FormField) => {
  switch (field.meta?.fieldType?.type) {
    case "Scalar":
      switch (field.meta.fieldType.name) {
        case "Int":
        case "Float":
          return {
            type: "number",
            maximum: field.constraint?.max,
            minimum: field.constraint?.min,
            exclusiveMaximum: field.constraint?.exclusiveMax,
            exclusiveMinimum: field.constraint?.exclusiveMin,
            multipleOf: field.constraint?.multipleOf,
            enum: field.constraint?.oneOf,
          } as const;
        case "String":
        default: {
          return {
            type: "string",
            maxLength: field.constraint?.maxLength,
            minLength: field.constraint?.minLength,
            format: field.constraint?.format,
            pattern: field.constraint?.pattern,
            enum: field.constraint?.oneOf,
          } as const;
        }
        case "Boolean":
          return {
            type: "boolean",
          } as const;
      }
    case "Enum": {
      return {
        type: "string",
        enum: field.meta.fieldType.meta.values,
      } as const;
    }
    default:
      // TODO: handle other types (e.g. object, array)
      return null;
  }
};

type SchemaType = {
  type: "object";
  properties: Record<string, unknown>;
  required: Array<string>;
  additionalProperties: true;
};

export const buildAjvSchema = (fields: FormFields) => {
  const schema: SchemaType = {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: true,
  };

  fields.forEach((field) => {
    const path = field.field.asKey().split(".");
    const current = path.slice(0, -1).reduce<SchemaType>((acc, key) => {
      if (!acc.properties[key]) {
        acc.properties[key] = {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: true,
        };
      }
      return acc.properties[key] as SchemaType;
    }, schema);

    const lastKey = path[path.length - 1];
    const property = convertToAjvProperty(field);

    if (property !== null) {
      current.properties[lastKey] = property;
      if (field.meta?.isRequired) {
        current.required.push(lastKey);
      }
    }
  });

  return schema as unknown as JSONSchemaType<Record<string, unknown>>;
};
