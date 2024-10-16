import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import Document from "./directive.graphql";

export const generateConfig = () => {
  const tempGQLFile = path.join(os.tmpdir(), "fabrix-graphql-config.graphql");

  fs.writeFileSync(tempGQLFile, Document);

  return {
    directiveSchema: tempGQLFile,
  };
};
