import { schemaDefinition } from "./schema";
import { describe, it, expect } from "vitest";

describe("schemaDefinitions", () => {
  it("should have valid definitions", () => {
    expect(schemaDefinition.definitions.length).not.toBeLessThanOrEqual(0);
  });
});
