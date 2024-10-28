import { describe, it, expect } from "vitest";
import { schemaDefinition } from "./schema";

describe("schemaDefinitions", () => {
  it("should have valid definitions", () => {
    expect(schemaDefinition.definitions.length).not.toBeLessThanOrEqual(0);
    schemaDefinition.definitions.forEach((def) => {
      expect(def).not.toBeUndefined();
    });
  });
});
