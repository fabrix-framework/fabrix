import { FieldType } from "@renderers/shared";
import { Path } from "@visitor";

type FieldMeta = {
  fieldType: FieldType;
  isRequired: boolean;
} | null;

export type FieldConfig<
  C extends Record<string, unknown>,
  E extends Record<string, unknown> = Record<string, unknown>,
> = {
  field: Path;
  config: C;
} & E;

export type FieldConfigWithMeta<C extends Record<string, unknown>> =
  FieldConfig<
    C,
    {
      meta: FieldMeta;
    }
  >;

type Merger<
  C extends Record<string, unknown>,
  E extends Record<string, unknown>,
> = (
  fieldValue: FieldConfigWithMeta<C> | undefined,
  directiveValue: FieldConfig<C, E> | undefined,
) => Omit<FieldConfigWithMeta<C> & E, "field"> | null;

/*
 * Merge the default field configs with the input field configs
 */
export const mergeFieldConfigs = <
  C extends Record<string, unknown>,
  E extends Record<string, unknown>,
>(
  fieldConfigs: Array<FieldConfigWithMeta<C>>,
  directiveInput: Array<FieldConfig<C, E>>,
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
