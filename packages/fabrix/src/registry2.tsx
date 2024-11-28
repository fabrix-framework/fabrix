import { ComponentType } from "react";

type CustomComponentType = "field" | "formField";

interface ComponentEntry<P> {
  type: CustomComponentType;
  component: ComponentType<P>;
}

type ComponentMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ComponentEntry<any>
>;

export class ComponentRegistryV2<T extends ComponentMap> {
  constructor(
    readonly props: {
      custom: T;
    },
  ) {}

  getComponent<K extends keyof T>(type: K): T[K]["component"] {
    return this.props.custom[type].component;
  }
}
