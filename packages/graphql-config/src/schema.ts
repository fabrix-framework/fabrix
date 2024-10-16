import { parse } from "graphql";
import Document from "./directive.graphql";

export const schemaDefinition = parse(Document);
