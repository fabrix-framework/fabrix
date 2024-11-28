import {
  ComponentRegistryV2,
  FieldComponentProps,
  FormFieldComponentProps,
} from "@registry2";
import { describe, expect, test } from "vitest";

const customField1 = {
  type: "field",
  component: (props: FieldComponentProps<{ name: string }>) => (
    <div>{props.customProps.name}</div>
  ),
} as const;

const customField2 = {
  type: "formField",
  component: (props: FormFieldComponentProps<{ age: number }>) => {
    return <div>{props.customProps.age}</div>;
  },
} as const;

describe("ComponentRegistryV2", () => {
  const cc = new ComponentRegistryV2({
    custom: {
      customField1,
      customField2,
    },
  });

  test("getCustom", () => {
    const a = cc.getFabrixComponent("customField1");
    expect(a).not.toBeUndefined();
  });

  test("getDynamicWithType", () => {
    const c = cc.getComponentDynamicWithType<"field">("customField1");
    expect(c).not.toBeUndefined();
  });
});
