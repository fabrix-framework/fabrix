import { FabrixContextType } from "@context";
import { formFieldSchema } from "@directive/schema";
import { DirectiveInput, FieldWithDirective } from "@readers/shared";
import { resolveFieldType } from "@renderers/shared";
import { FieldVariables, Path } from "@visitor";
import { deepmerge } from "deepmerge-ts";
import { GraphQLInputObjectType, GraphQLNonNull } from "graphql";

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
      meta: {
        fieldType: resolveFieldType(
          field.type instanceof GraphQLNonNull ? field.type.ofType : field.type,
        ),
        isRequired: field.type instanceof GraphQLNonNull,
      },
      config: formFieldSchema.parse({
        index,
        label: field.name,
      }),
    };
  });
};

export const formFieldMerger = <C extends Record<string, unknown>>(
  fieldValue: FieldWithDirective<C> | undefined,
  directiveValue:
    | DirectiveInput<
        C,
        {
          constraint?: Record<string, unknown> | null;
        }
      >
    | undefined,
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
