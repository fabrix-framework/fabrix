import { FabrixContextType } from "@context";
import {
  formFieldConstraintSchema,
  FormFieldSchema,
  formFieldSchema,
} from "@directive/schema";
import { resolveFieldType } from "@renderers/shared";
import { FieldVariables } from "@visitor";
import { deepmerge } from "deepmerge-ts";
import {
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLNonNull,
} from "graphql";
import { z } from "zod";
import { Path } from "@visitor/path";
import { FieldConfigWithMeta, FieldConfig } from "./shared";

const buildFieldMeta = (type: GraphQLInputType) => ({
  fieldType: resolveFieldType(
    type instanceof GraphQLNonNull ? type.ofType : type,
  ),
  isRequired: type instanceof GraphQLNonNull,
});

export type FieldMeta = ReturnType<typeof buildFieldMeta> | null;

/**
 * Infer the field configuration from the input object type for the form
 */
export const buildDefaultFormFieldConfigs = (
  context: FabrixContextType,
  fieldVariables: FieldVariables,
) => {
  if (!("input" in fieldVariables)) {
    return [];
  }

  if (context.schemaLoader.status === "loading") {
    return [];
  }

  const inputType = context.schemaLoader.schemaSet.serverSchema.getType(
    fieldVariables.input.type,
  );
  if (!inputType) {
    return [];
  }

  // Only support object type for "input" argument
  if (!(inputType instanceof GraphQLInputObjectType)) {
    return [];
  }

  const fields = inputType.getFields();
  return Object.keys(fields).map((key, index) => {
    const field = fields[key];
    const path = new Path(key.split("."));

    return {
      field: path,
      meta: buildFieldMeta(field.type),
      config: formFieldSchema.parse({
        index,
        label: field.name,
      }),
    };
  });
};

export type FormFieldExtra = {
  constraint?: z.infer<typeof formFieldConstraintSchema>;
};

export const formFieldMerger = (
  fieldValue: FieldConfigWithMeta<FormFieldSchema> | undefined,
  directiveValue: FieldConfig<FormFieldSchema, FormFieldExtra> | undefined,
) => {
  if (fieldValue && directiveValue) {
    return {
      config: deepmerge(fieldValue.config, directiveValue.config),
      meta: fieldValue.meta,
      constraint: directiveValue.constraint,
    };
  } else if (fieldValue) {
    return {
      config: fieldValue.config,
      meta: fieldValue.meta,
    };
  } else if (directiveValue) {
    return {
      config: directiveValue.config,
      meta: null,
      constraint: directiveValue.constraint,
    };
  } else {
    return null;
  }
};
