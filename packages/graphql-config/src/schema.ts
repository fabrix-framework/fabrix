import { DocumentNode, Kind } from "graphql";
import CommonSchema from "./schema/common.graphql";
import ViewDirectiveSchema from "./schema/view.graphql";
import FormDirectiveSchema from "./schema/form.graphql";

const mergeDocumentNodes = (docs: DocumentNode[]) => ({
  kind: Kind.DOCUMENT,
  definitions: docs.flatMap((doc) => doc.definitions),
});

export const schemaDefinition = mergeDocumentNodes([
  CommonSchema,
  ViewDirectiveSchema,
  FormDirectiveSchema,
]);
