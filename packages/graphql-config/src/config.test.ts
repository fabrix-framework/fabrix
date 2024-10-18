import { vol } from "memfs";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateConfig } from "./config";

vi.mock("node:fs", async () => {
  const { fs } = await vi.importActual("memfs");
  return fs;
});
vi.mock("node:os", () => ({
  tmpdir: () => "/tmp",
}));

beforeEach(() => {
  vol.fromJSON({
    "/tmp": null,
  });
});

describe("generateConfig", () => {
  test("should generate a config", () => {
    const filePath = generateConfig();
    const dirs = vol.toJSON();
    expect(dirs[filePath.directiveSchema]).not.toHaveLength(0);
  });
});
