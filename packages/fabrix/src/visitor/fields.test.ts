import { describe, test, expect } from "vitest";
import { Fields } from "./fields";

describe("Fields", () => {
  const fields = new Fields([]);

  fields.add({
    name: "a",
    fields: ["b", "c"],
    directives: [],
  });
  fields.add({
    name: "b",
    fields: [],
    directives: [],
  });

  fields.add({
    name: "c",
    fields: ["d", "e"],
    directives: [],
  });
  fields.add({
    name: "d",
    fields: [],
    directives: [],
  });
  fields.add({
    name: "e",
    fields: [],
    directives: [],
  });

  test.each(["a.b", "a.c", "a.c.d", "a.c.e"])(
    "getByPathKey (%s) should not be undefined",
    (pathKey) => {
      expect(fields.getByPathKey(pathKey)).not.toBeUndefined();
    },
  );

  test("getChildren should return all children", () => {
    expect(fields.getChildren("a").unwrap().length).toBe(2);
  });

  test("getChildrenWithAncestors should return all children with ancestors", () => {
    expect(fields.getChildrenWithAncestors("a").unwrap().length).toBe(4);
  });

  test.each([
    ["b", "a"],
    ["c", "a"],
    ["d", "c"],
    ["e", "c"],
    ["a", undefined],
  ])("getParent of '%s' should be '%s'", (child, parent) => {
    expect(fields.getParent(child)?.getName()).toBe(parent);
  });

  test.each([
    ["a.b", "a"],
    ["a.c", "a"],
    ["a.c.d", "c"],
    ["a.c.e", "c"],
  ])("getParent of '%s' should be '%s'", (child, parent) => {
    expect(fields.getByPathKey(child)?.getParentName()).toBe(parent);
  });
});
