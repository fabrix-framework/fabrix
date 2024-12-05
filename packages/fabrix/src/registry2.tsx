import { BaseComponentProps, Field, TableComponentHeader } from "@registry";
import { ComponentProps, ComponentType } from "react";
import { FabrixComponentProps } from "@renderer";
import { FabrixComponent2, FabrixComponent2Props } from "@renderer2";

export type CustomProps<P> = {
  customProps: P;
};

export type FieldComponentProps<P = unknown> = BaseComponentProps &
  CustomProps<P> & {
    path: string[];
    subFields: Array<Field>;
  };

export type FieldsComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  value: Record<string, unknown>;
};

export type FormFieldComponentProps<P = unknown> = BaseComponentProps &
  CustomProps<P> & {
    isRequired: boolean;
  };

export type FormComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  renderFields: () => React.ReactNode;
  renderSubmit: (
    renderer: (props: {
      submit: () => void;
      isSubmitting: boolean;
    }) => React.ReactElement,
  ) => React.ReactNode;
  renderReset: (
    renderer: (props: { reset: () => void }) => React.ReactNode,
  ) => React.ReactNode;
};

export type TableComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  headers: TableComponentHeader[];
  values: Record<string, unknown>[];
};

export type TableCellComponentProps<P = unknown> = FieldComponentProps<P>;

export type FieldComponentEntry<P = unknown> = {
  type: "field";
  component: ComponentType<FieldComponentProps<P>>;
};
export type FieldsComponentEntry<P = unknown> = {
  type: "fields";
  component: ComponentType<FieldsComponentProps<P>>;
};
export type FormFieldComponentEntry<P = unknown> = {
  type: "formField";
  component: ComponentType<FormFieldComponentProps<P>>;
};
export type FormComponentEntry<P = unknown> = {
  type: "form";
  component: ComponentType<FormComponentProps<P>>;
};
export type TableComponentEntry<P = unknown> = {
  type: "table";
  component: ComponentType<TableComponentProps<P>>;
};
export type TableCellComponentEntry<P = unknown> = {
  type: "tableCell";
  component: ComponentType<TableCellComponentProps<P>>;
};

export type ComponentEntry<P = unknown> =
  | FieldComponentEntry<P>
  | FieldsComponentEntry<P>
  | FormFieldComponentEntry<P>
  | FormComponentEntry<P>
  | TableComponentEntry<P>
  | TableCellComponentEntry<P>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentMap = Record<string, ComponentEntry<any>>;

type ComponentTypeByName<T extends ComponentEntry["type"]> = ComponentType<
  T extends "field"
    ? FieldComponentProps
    : T extends "formField"
      ? FormFieldComponentProps
      : T extends "form"
        ? FormComponentProps
        : T extends "table"
          ? TableComponentProps
          : T extends "tableCell"
            ? TableCellComponentProps
            : never
>;

export class ComponentRegistryV2<T extends ComponentMap> {
  constructor(
    readonly props: {
      custom?: T;
      default?: {
        [K in ComponentEntry["type"]]?: ComponentTypeByName<K>;
      };
    },
  ) {}

  getComponent<N extends keyof T>(name: N) {
    const componentEntry = this.props.custom?.[name];
    const componentName = name as string;
    if (!componentEntry) {
      throw new Error(`Component ${componentName} not found`);
    }

    return (props: {
      query: FabrixComponentProps["query"];
      customProps: ComponentProps<T[N]["component"]>["customProps"];
      children?: FabrixComponent2Props["children"];
    }) => (
      <FabrixComponent2
        query={props.query}
        component={{
          name: componentName,
          entry: componentEntry,
          customProps: props.customProps,
        }}
      >
        {props.children}
      </FabrixComponent2>
    );
  }

  getComponentDynamicWithType<T extends ComponentEntry["type"]>(name: string) {
    return this.props.custom?.[name].component as
      | undefined
      | ComponentTypeByName<T>;
  }
}
