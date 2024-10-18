import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import CommonSchema from "./schema/common.graphql";
import ViewDirectiveSchema from "./schema/view.graphql";
import FormDirectiveSchema from "./schema/form.graphql";
import ConstraintSchema from "./schema/constraint.graphql";

export const generateConfig = () => {
  const tempGQLFile = path.join(os.tmpdir(), "fabrix-graphql-config.graphql");

  fs.writeFileSync(
    tempGQLFile,
    CommonSchema + ViewDirectiveSchema + FormDirectiveSchema + ConstraintSchema,
  );

  return {
    directiveSchema: tempGQLFile,
  };
};
