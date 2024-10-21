import { viewFieldSchema } from "@directive/schema";
import { FieldWithDirective, DirectiveInput } from "@readers/shared";
import { Fields } from "@visitor";
import { deepmerge } from "deepmerge-ts";

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
      meta: null,
    };
  });

export const viewFieldMerger = <C extends Record<string, unknown>>(
  fieldValue: FieldWithDirective<C> | undefined,
  directiveValue: DirectiveInput<C> | undefined,
) => {
  if (fieldValue && directiveValue) {
    return {
      config: deepmerge(fieldValue.config, directiveValue.config),
      meta: fieldValue.meta,
    };
  } else if (fieldValue) {
    return { config: fieldValue.config, meta: fieldValue.meta };
  } else if (directiveValue) {
    return { config: directiveValue.config, meta: null };
  } else {
    return null;
  }
};
