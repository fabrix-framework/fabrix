import { BaseComponentProps, Field, TableComponentHeader } from "@registry";
import { ComponentProps, ComponentType } from "react";
import { FabrixComponentProps } from "@renderer";
import {
  FabrixCustomComponent,
  FabrixCustomComponentProps,
} from "@customRenderer";

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

export type CompositeComponentEntry<P = unknown> =
  | FieldsComponentEntry<P>
  | FormComponentEntry<P>
  | TableComponentEntry<P>;
export type CompositeComponentMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CompositeComponentEntry<any>
>;

export type UnitComponentEntry<P = unknown> =
  | FieldComponentEntry<P>
  | FormFieldComponentEntry<P>
  | TableCellComponentEntry<P>;
export type UnitComponentMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UnitComponentEntry<any>
>;

type ComponentTypeByName<T extends CompositeComponentEntry["type"]> =
  ComponentType<
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

export class ComponentRegistryV2<
  CC extends CompositeComponentMap,
  UC extends UnitComponentMap,
> {
  constructor(
    private readonly props: {
      custom?: {
        composite?: CC;
        unit: UC;
      };
      default?: {
        [K in CompositeComponentEntry["type"]]?: ComponentTypeByName<K>;
      };
    },
  ) {}

  merge(registry: ComponentRegistryV2<CC, UC>) {
    return new ComponentRegistryV2({
      custom: {
        composite: {
          ...this.props.custom?.composite,
          ...registry.props.custom?.composite,
        },
        unit: {
          ...this.props.custom?.unit,
          ...registry.props.custom?.unit,
        },
      },
      default: {
        ...this.props.default,
        ...registry.props.default,
      },
    });
  }

  getFabrixComponent<N extends keyof CC>(name: N) {
    const componentEntry = this.props.custom?.composite?.[name];
    const componentName = name as string;
    if (!componentEntry) {
      throw new Error(`Component ${componentName} not found`);
    }

    return (props: {
      query: FabrixComponentProps["query"];
      customProps: ComponentProps<CC[N]["component"]>["customProps"];
      children?: FabrixCustomComponentProps["children"];
    }) => (
      <FabrixCustomComponent
        query={props.query}
        component={{
          name: componentName,
          entry: componentEntry,
          customProps: props.customProps,
        }}
      >
        {props.children}
      </FabrixCustomComponent>
    );
  }

  getUnitComponentByName<N extends keyof UC>(name: N) {
    return this.props.custom?.unit?.[name]?.component;
  }

  getCompositeComponentByName<N extends keyof CC>(name: N) {
    return this.props.custom?.composite?.[name]?.component;
  }
}

export const emptyComponentRegistryV2 = new ComponentRegistryV2({});
