import { FabrixContextType } from "@context";
import {
  formFieldConstraintSchema,
  formFieldSchema,
  FormFieldSchema,
} from "@directive/schema";
import { resolveFieldType } from "@renderers/typename";
import { FieldVariables } from "@visitor";
import { Path } from "@visitor/path";
import { deepmerge } from "deepmerge-ts";
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLType,
} from "graphql";
import { z } from "zod";
import { FieldConfigWithMeta, FieldConfig } from "./shared";

const buildFieldMeta = (type: GraphQLType) => ({
  fieldType: resolveFieldType(
    type instanceof GraphQLNonNull ? type.ofType : type,
  ),
  isRequired: type instanceof GraphQLNonNull,
});

export type FieldMeta = ReturnType<typeof buildFieldMeta> | null;

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

/**
 * Infer the field configuration from the input types for the form
 */
export const getInputFields = (
  context: FabrixContextType,
  fieldVariables: FieldVariables,
) =>
  Object.keys(fieldVariables).flatMap((name) => {
    if (context.schemaLoader.status === "loading") {
      return [];
    }

    const fieldType = fieldVariables[name].type;
    const type = context.schemaLoader.schemaSet.serverSchema.getType(
      fieldType.name,
    );
    const path = new Path([name]);

    // handling variation of GraphQLNamedInputType
    if (type instanceof GraphQLScalarType || type instanceof GraphQLEnumType) {
      return [
        {
          field: path,
          meta: {
            fieldType: resolveFieldType(type),
            isRequired: !fieldType.isNull,
          },
          config: formFieldSchema.parse({
            label: path.asKey(),
          }),
        },
      ];
    } else if (type instanceof GraphQLInputObjectType) {
      const fields = type.getFields();
      return Object.keys(fields).map((key) => {
        const field = fields[key];
        const fieldPath = path.append(new Path(key.split(".")));

        return {
          field: fieldPath,
          meta: buildFieldMeta(field.type),
          config: formFieldSchema.parse({
            label: fieldPath.asKey(),
          }),
        };
      });
    }

    return [];
  });
