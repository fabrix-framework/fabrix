import { FieldType } from "@renderers/shared";
import { Path } from "@visitor";

type FieldMeta = {
  fieldType: FieldType;
  isRequired: boolean;
} | null;

export type FieldWithDirective<
  C extends Record<string, unknown> = Record<string, unknown>,
> = {
  field: Path;
  config: C;
  meta: FieldMeta;
};

export type DirectiveInput<
  C extends Record<string, unknown> = Record<string, unknown>,
  E extends Record<string, unknown> = Record<string, unknown>,
> = {
  field: Path;
  config: C;
} & E;

type Merger<
  C extends Record<string, unknown>,
  E extends Record<string, unknown>,
> = (
  fieldValue: FieldWithDirective<C> | undefined,
  directiveValue: DirectiveInput<C, E> | undefined,
) => Omit<FieldWithDirective<C> & E, "field"> | null;

/*
 * Merge the default field configs with the input field configs
 */
export const mergeFieldConfigs = <
  C extends Record<string, unknown>,
  E extends Record<string, unknown>,
>(
  fieldConfigs: Array<FieldWithDirective<C>>,
  directiveInput: Array<DirectiveInput<C, E>>,
  merger: Merger<C, E>,
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
      ...mergedValue,
    };
  });
};
