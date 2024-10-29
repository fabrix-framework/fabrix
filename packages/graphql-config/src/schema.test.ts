import { describe, it, expect } from "vitest";
import { buildASTSchema } from "graphql";
import { schemaDefinition } from "./schema";

describe.skip("schemaDefinition", () => {
  it("should be buildable", () => {
    expect(buildASTSchema(schemaDefinition)).not.toThrow();
  });
});
