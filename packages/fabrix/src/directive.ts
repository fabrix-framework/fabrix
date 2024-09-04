import { DirectiveNode } from "graphql";
import { z, ZodRawShape } from "zod";
import { buildDirectiveConfig, DirectiveConfig } from "@visitor";
import { directiveSchemaMap } from "@directive/schema";

export const parseDirectiveArguments = <S extends ZodRawShape = ZodRawShape>(
  directiveArguments: DirectiveConfig["arguments"],
  schemaToParse: z.ZodObject<S>,
) => {
  const parsedValue = schemaToParse.safeParse(directiveArguments);
  if (!parsedValue.success) {
    throw new Error(parsedValue.error.message);
  }
  return parsedValue.data;
};

type FieldConfig<C> = {
  config: C;
  field?: string | null;
};

/**
 * A helper function to build a record from object array that has `field` key
 */
export const buildRecordByFieldName = <
  C extends Record<string, unknown>,
  V extends FieldConfig<C> = FieldConfig<C>,
  T extends Array<V> = Array<V>,
>(
  input: T,
) => {
  return input.reduce<Record<string, { config: C }>>(
    (acc, value) =>
      value.field
        ? {
            ...acc,
            [value.field]: {
              config: value.config,
            },
          }
        : acc,
    {},
  );
};

export const findDirective = (
  directives: ReadonlyArray<DirectiveNode> | undefined,
) => {
  if (directives === undefined) {
    return null;
  }

  const directive = directives
    .map(buildDirectiveConfig)
    .find((d) => Object.keys(directiveSchemaMap).includes(d.name));
  if (directive === undefined) {
    return null;
  }

  return {
    name: directive.name as keyof typeof directiveSchemaMap,
    arguments: directive.arguments,
  };
};
