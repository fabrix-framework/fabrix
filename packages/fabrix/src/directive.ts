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
