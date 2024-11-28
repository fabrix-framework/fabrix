import { ComponentProps, ComponentRegistryV2 } from "@registry2";
import { describe, expect, test } from "vitest";

describe("ComponentRegistryV2", () => {
  test("getCustom", () => {
    const cc = new ComponentRegistryV2({
      custom: {
        customField1: {
          type: "field",
          component: (props: ComponentProps<{ name: string }>) => (
            <div>{props.customProps.name}</div>
          ),
        },
        customField2: {
          type: "field",
          component: (props: ComponentProps<{ age: number }>) => {
            return <div>{props.customProps.age}</div>;
          },
        },
      },
    });

    const a = cc.getComponent("customField1");

    expect(a).not.toBeUndefined();
  });
});
