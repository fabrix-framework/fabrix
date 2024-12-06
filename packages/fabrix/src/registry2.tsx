import { ComponentProps, ComponentType } from "react";
import { FabrixComponentProps } from "@renderer";
import { ViewFieldSchema } from "@directive/schema";
import { FieldType } from "@renderers/shared";
import {
  FabrixCustomComponent,
  FabrixCustomComponentProps,
} from "@customRenderer";

export type DirectiveAttributes = Pick<ViewFieldSchema, "label"> & {
  className: string;
};

export type UserProps = Record<string, string | undefined>;
export type CustomRendererProps<P extends UserProps> = {
  userProps?: P;
};

export type BaseComponentProps<V = unknown> = {
  name: string;
  value: V;
  type: FieldType;
  attributes: DirectiveAttributes;
};

export type Field = {
  key: string;
  label: string;
  type: FieldType;
};

export type CustomProps<P> = {
  customProps: P;
};

type FieldLikeComponentProps = BaseComponentProps & {
  path: string[];
  subFields: Array<Field>;
};

export type FieldComponentProps<UP extends UserProps = UserProps> =
  FieldLikeComponentProps & CustomRendererProps<UP>;

export type FieldsComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  value: Record<string, unknown>;
};

export type FormFieldComponentProps<UP extends UserProps = UserProps> =
  BaseComponentProps &
    CustomRendererProps<UP> & {
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

export type TableComponentHeader = Field & {
  render: ((rowValue: Record<string, unknown>) => React.ReactElement) | null;
};

export type TableComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  headers: TableComponentHeader[];
  values: Record<string, unknown>[];
};

export type TableCellComponentProps<UP extends UserProps = UserProps> =
  FieldLikeComponentProps & CustomRendererProps<UP>;

export type FieldComponentEntry = {
  type: "field";
  component: ComponentType<FieldComponentProps>;
};
export type FieldsComponentEntry<P = unknown> = {
  type: "fields";
  component: ComponentType<FieldsComponentProps<P>>;
};
export type FormFieldComponentEntry = {
  type: "formField";
  component: ComponentType<FormFieldComponentProps>;
};
export type FormComponentEntry<P = unknown> = {
  type: "form";
  component: ComponentType<FormComponentProps<P>>;
};
export type TableComponentEntry<P = unknown> = {
  type: "table";
  component: ComponentType<TableComponentProps<P>>;
};
export type TableCellComponentEntry = {
  type: "tableCell";
  component: ComponentType<TableCellComponentProps>;
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

export type UnitComponentEntry =
  | FieldComponentEntry
  | FormFieldComponentEntry
  | TableCellComponentEntry;
export type UnitComponentMap = Record<string, UnitComponentEntry>;

type ComponentEntries = CompositeComponentEntry | UnitComponentEntry;

type ComponentTypeByName<T extends ComponentEntries["type"]> = ComponentType<
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

/**
 * Extracts the keys of a record type that are strings.
 *
 * Without this, TypeScript infers the record keys as `string | number | symbol`,
 * but we want to ensure that the keys are strings.
 */
type KeyOf<T> = T extends Record<infer K, unknown> ? Extract<K, string> : never;

export class ComponentRegistry<
  CC extends CompositeComponentMap = CompositeComponentMap,
  UC extends UnitComponentMap = UnitComponentMap,
> {
  constructor(
    private readonly props: {
      custom?: {
        composite?: CC;
        unit?: UC;
      };
      default?: {
        [K in ComponentEntries["type"]]?: ComponentTypeByName<K>;
      };
    },
  ) {}

  merge(registry: ComponentRegistry<CC, UC>) {
    return new ComponentRegistry({
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

  getFabrixComponent<N extends KeyOf<CC>>(name: N) {
    const componentEntry = this.props.custom?.composite?.[name];
    if (!componentEntry) {
      throw new Error(`Component ${name} not found`);
    }

    return (props: {
      query: FabrixComponentProps["query"];
      customProps: ComponentProps<CC[N]["component"]>["customProps"];
      children?: FabrixCustomComponentProps["children"];
    }) => (
      <FabrixCustomComponent
        query={props.query}
        component={{
          name,
          entry: componentEntry,
          customProps: props.customProps,
        }}
      >
        {props.children}
      </FabrixCustomComponent>
    );
  }

  getUnitComponentByName<T extends UnitComponentEntry["type"]>(
    name: KeyOf<UC>,
  ) {
    return this.props.custom?.unit?.[name]?.component as ComponentTypeByName<T>;
  }

  getCompositeComponentByName<T extends ComponentEntries["type"]>(
    name: KeyOf<CC>,
  ) {
    return this.props.custom?.composite?.[name]
      ?.component as ComponentTypeByName<T>;
  }

  getDefaultComponentByType<T extends ComponentEntries["type"]>(type: T) {
    return this.props.default?.[type] as ComponentTypeByName<T>;
  }
}

export const emptyComponentRegistry = new ComponentRegistry({});
