import { FabrixContextType } from "@context";
import { formFieldSchema, viewFieldSchema } from "@directive/schema";
import { resolveFieldType } from "@renderers/shared";
import { Fields, FieldVariables, Path } from "@visitor";
import { deepmerge } from "deepmerge-ts";
import { GraphQLInputObjectType, GraphQLNonNull } from "graphql";

export type FieldWithDirective<
  C extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
> = {
  field: Path;
  config: C;
  meta: M;
};

type DirectiveInput<
  C extends Record<string, unknown> = Record<string, unknown>,
> = {
  field: Path;
  config: C;
};

const merger = <
  C extends Record<string, unknown>,
  M extends Record<string, unknown>,
>(
  fieldValue: FieldWithDirective<C, M> | undefined,
  directiveValue: DirectiveInput<C> | undefined,
) => {
  if (fieldValue && directiveValue) {
    return {
      config: deepmerge<[C, C]>(fieldValue.config, directiveValue.config),
      meta: fieldValue.meta,
    };
  } else if (fieldValue) {
    return { config: fieldValue.config, meta: fieldValue.meta };
  } else if (directiveValue) {
    return { config: directiveValue.config, meta: {} };
  } else {
    return null;
  }
};

/*
 * Merge the default field configs with the input field configs
 */
export const mergeFieldConfigs = <
  C extends Record<string, unknown>,
  M extends Record<string, unknown>,
>(
  fieldConfigs: Array<FieldWithDirective<C, M>>,
  directiveInput: Array<DirectiveInput<C>>,
) => {
  const allFieldKeys = new Set([
    ...fieldConfigs.map((f) => f.field.asKey()),
    ...directiveInput.map((f) => f.field.asKey()),
  ]);

  return Array.from(allFieldKeys).flatMap((key) => {
    const directiveValue = directiveInput.find((f) => f.field.asKey() === key);
    const fieldValue = fieldConfigs.find((f) => f.field.asKey() === key);
    const field = directiveValue?.field || fieldValue?.field;
    if (!field) {
      return [];
    }

    const mergedValue = merger(fieldValue, directiveValue);
    if (!mergedValue) {
      return [];
    }

    return {
      field,
      config: mergedValue.config,
      meta: mergedValue.meta,
    };
  });
};

/**
 * Infer the field configuration from the fields
 */
export const buildDefaultViewFieldConfigs = (fields: Fields) =>
  fields.unwrap().flatMap((field) => {
    const config = viewFieldSchema.parse({
      index: 0,
      label: field.getName(),
    });

    // This field configs are used to be merged into the field configs on directives
    // So we need to skip the root path here.
    const path = field.value.path.rootOffset(1);
    if (!path) {
      return [];
    }

    return {
      field: path,
      config,
      meta: {},
    };
  });

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
