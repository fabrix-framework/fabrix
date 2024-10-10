import { FabrixContextType } from "@context";
import {
  FormFieldSchema,
  formFieldSchema,
  viewFieldSchema,
} from "@directive/schema";
import { FormFieldMeta } from "@renderers/form";
import { resolveFieldType } from "@renderers/shared";
import { Fields, FieldVariables, Path } from "@visitor";
import { deepmerge } from "deepmerge-ts";
import { GraphQLInputObjectType, GraphQLNonNull } from "graphql";

export type FieldWithDirective<
  C extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
> = {
  path: Path;
  config: C;
  meta: M;
};

type DirectiveInput = Array<{
  field: Path;
  config: Record<string, unknown>;
}>;

/*
 * Merge the default field configs with the input field configs
 */
export const mergeFieldConfigs = <
  C extends Record<string, unknown>,
  M extends Record<string, unknown>,
>(
  fieldConfigs: Array<FieldWithDirective<C, M>>,
  directiveInput: DirectiveInput,
) =>
  fieldConfigs.flatMap((field) => {
    const pathKey = field.path.asKey();
    if (!pathKey) {
      return [];
    }

    const targetInput = directiveInput.find((f) => f.field.asKey() === pathKey);
    return {
      path: field.path,
      config: targetInput
        ? deepmerge(field.config, targetInput.config)
        : field.config,
      meta: field.meta,
    };
  });

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
      path,
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
  return Object.keys(fields).map<
    FieldWithDirective<FormFieldSchema, FormFieldMeta>
  >((key, index) => {
    const field = fields[key];
    const path = new Path(key.split("."));

    return {
      path: path,
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
