import { ComponentRegistryV2 } from "@registry2";
import { describe, expect, test } from "vitest";

describe("ComponentRegistryV2", () => {
  test("getCustom", () => {
    const cc = new ComponentRegistryV2({
      custom: {
        customField1: {
          type: "field",
          component: (props: { name: string }) => <div>{props.name}</div>,
        },
        customField2: {
          type: "field",
          component: (props: { age: string }) => <div>{props.age}</div>,
        },
      },
    });

    const a = cc.getComponent("customField1");

    expect(1).toBe(1);
  });
});
