import { BaseComponentProps, Field, TableComponentHeader } from "@registry";
import { ComponentType } from "react";

export type CustomProps<P> = {
  customProps: P;
};

export type FieldComponentProps<P = unknown> = BaseComponentProps &
  CustomProps<P> & {
    path: string[];
    subFields: Array<Field>;
  };

export type FormFieldComponentProps<P = unknown> = BaseComponentProps &
  CustomProps<P> & {
    isRequired: boolean;
  };

export type FormComponentProps<P = unknown> = BaseComponentProps &
  CustomProps<P> & {
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

export type TableComponentProps<P = unknown> = BaseComponentProps &
  CustomProps<P> & {
    name?: string;
    className?: string;
    headers: TableComponentHeader[];
    values: Record<string, unknown>[];
  };

export type TableCellComponentProps<P = unknown> = FieldComponentProps<P>;

type ComponentEntry<P = unknown> =
  | {
      type: "field";
      component: ComponentType<FieldComponentProps<P>>;
    }
  | {
      type: "formField";
      component: ComponentType<FormFieldComponentProps<P>>;
    }
  | {
      type: "form";
      component: ComponentType<FormComponentProps<P>>;
    }
  | {
      type: "table";
      component: ComponentType<TableComponentProps<P>>;
    }
  | {
      type: "tableCell";
      component: ComponentType<TableCellComponentProps<P>>;
    };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentMap = Record<string, ComponentEntry<any>>;

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

  getComponent<K extends keyof T>(type: K): T[K]["component"] | undefined {
    return this.props.custom?.[type].component;
  }

  getComponentDynamicWithType<T extends ComponentEntry["type"]>(name: string) {
    return this.props.custom?.[name].component as
      | undefined
      | ComponentTypeByName<T>;
  }
}
