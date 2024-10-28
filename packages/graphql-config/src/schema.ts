import { DocumentNode, Kind, parse } from "graphql";
import CommonSchema from "./schema/common.graphql";
import ViewDirectiveSchema from "./schema/view.graphql";
import FormDirectiveSchema from "./schema/form.graphql";
import ConstraintSchema from "./schema/constraint.graphql";

const mergeDocumentNodes = (rawDefinition: string[]) => ({
  kind: Kind.DOCUMENT as const,
  definitions: rawDefinition.map((def) => parse(def)),
});

export const schemaDefinition = mergeDocumentNodes([
  CommonSchema,
  ViewDirectiveSchema,
  FormDirectiveSchema,
  ConstraintSchema,
]);
