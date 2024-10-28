import { parse } from "graphql";
import { mergeTypeDefs } from "@graphql-tools/merge";
import CommonSchema from "./schema/common.graphql";
import ViewDirectiveSchema from "./schema/view.graphql";
import FormDirectiveSchema from "./schema/form.graphql";
import ConstraintSchema from "./schema/constraint.graphql";

const parseStringSchemas = (rawDefinition: string[]) =>
  rawDefinition.map((def) => parse(def));

export const schemaDefinition = mergeTypeDefs(
  parseStringSchemas([
    CommonSchema,
    ViewDirectiveSchema,
    FormDirectiveSchema,
    ConstraintSchema,
  ]),
);
