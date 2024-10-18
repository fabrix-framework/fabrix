import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { print } from "graphql";
import { schemaDefinition } from "./schema";

export const generateConfig = () => {
  const tempGQLFile = path.join(os.tmpdir(), "fabrix-graphql-config.graphql");
  const content = schemaDefinition.definitions.map(print).join("\n");

  fs.writeFileSync(tempGQLFile, content);

  return {
    directiveSchema: tempGQLFile,
  };
};
