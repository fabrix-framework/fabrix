import { FormRendererField, FormRendererFields } from "@renderers/form";

const convertToAjvProperty = (field: FormRendererField) => {
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
    default:
      // TODO: handle other types (e.g. object, array)
      return null;
  }
};

export const buildAjvSchema = (fields: FormRendererFields) => {
  const visibleFields = fields.filter((field) => !field.config.hidden);
  const requiredFields = visibleFields.filter(
    (field) => field.meta?.isRequired,
  );

  return {
    type: "object",
    properties: visibleFields.reduce((acc, field) => {
      const property = convertToAjvProperty(field);
      return property === null
        ? acc
        : { ...acc, [field.field.asKey()]: property };
    }, {}),
    required: requiredFields.map((field) => field.field.asKey()),
    additionalProperties: true,
  } as const;
};
