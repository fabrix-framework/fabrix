import { ComponentType } from "react";
import { FabrixComponentProps } from "@renderer";
import { ViewFieldSchema } from "@directive/schema";
import { FieldType } from "@renderers/shared";
import {
  FabrixCustomComponent,
  FabrixCustomComponentProps,
} from "@customRenderer";
import { U } from "vitest/dist/chunks/environment.CzISCQ7o";

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

/**
 * The component props that field renderer should implement.
 */
export type FieldComponentProps<UP extends UserProps = UserProps> =
  FieldLikeComponentProps & CustomRendererProps<UP>;

export type FieldsComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  value: Record<string, unknown>;
};

/**
 * The component props that form field renderer should implement.
 */
export type FormFieldComponentProps<UP extends UserProps = UserProps> =
  BaseComponentProps &
    CustomRendererProps<UP> & {
      isRequired: boolean;
    };

/**
 * The component props that form renderer should implement.
 */
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

/**
 * The component props that table renderer should implement.
 */
export type TableComponentProps<P = unknown> = CustomProps<P> & {
  name: string;
  className?: string;
  headers: TableComponentHeader[];
  values: Record<string, unknown>[];
};

/**
 * The component props that table cell renderer should implement.
 */
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

/**
 * Entries for composite components.
 */
export type CompositeComponentEntries<P = unknown> =
  | FieldsComponentEntry<P>
  | FormComponentEntry<P>
  | TableComponentEntry<P>;
export type CompositeComponentMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CompositeComponentEntries<any>
>;

/**
 * Entries for unit components.
 */
export type UnitComponentEntries =
  | FieldComponentEntry
  | FormFieldComponentEntry
  | TableCellComponentEntry;
export type UnitComponentMap = Record<string, UnitComponentEntries>;

type ComponentEntries = CompositeComponentEntries | UnitComponentEntries;

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

type Merge<
  F extends Record<string, unknown> | undefined,
  S extends Record<string, unknown> | undefined,
> = F extends undefined
  ? S extends undefined
    ? Record<string, never>
    : S
  : S extends undefined
    ? F
    : {
        [K in keyof F | keyof S]: K extends keyof S
          ? S[K]
          : K extends keyof F
            ? F[K]
            : never;
      };

export type ComponentRegistryProps<
  CC extends CompositeComponentMap,
  UC extends UnitComponentMap,
> = {
  custom?: {
    composite?: CC;
    unit?: UC;
  };
  default?: {
    [K in ComponentEntries["type"]]?: ComponentTypeByName<K>;
  };
};

/**
 * Component registry is a class that holds the custom components and default components.
 */
export class ComponentRegistry<
  P extends ComponentRegistryProps<
    CompositeComponentMap,
    UnitComponentMap
  > = ComponentRegistryProps<CompositeComponentMap, UnitComponentMap>,
> {
  constructor(private readonly props: P) {}

  merge<
    MP extends ComponentRegistryProps<CompositeComponentMap, UnitComponentMap>,
  >(registry: ComponentRegistry<MP>) {
    return new ComponentRegistry({
      custom: {
        composite: {
          ...this.props.custom?.composite,
          ...registry.props.custom?.composite,
        } as Merge<
          NonNullable<P["custom"]>["composite"],
          NonNullable<MP["custom"]>["composite"]
        >,
        unit: {
          ...this.props.custom?.unit,
          ...registry.props.custom?.unit,
        } as Merge<
          NonNullable<P["custom"]>["unit"],
          NonNullable<MP["custom"]>["unit"]
        >,
      },
      default: {
        ...this.props.default,
        ...registry.props.default,
      },
    });
  }

  /**
   * Get the custom component integrated with `FabrixComponent`.
   *
   * `getFabrixComponent` only accepts the name of the component as the parameter.
   * The reason is that only composite components are supposed to accept GraphQL query to build its presentation.
   */
  getFabrixComponent<
    K extends P["custom"] extends { composite: CompositeComponentMap }
      ? KeyOf<P["custom"]["composite"]>
      : never,
    CP extends P["custom"] extends { composite: CompositeComponentMap }
      ? P["custom"]["composite"][K]
      : never,
  >(name: K) {
    const componentEntry = this.props.custom?.composite?.[name];
    if (!componentEntry) {
      throw new Error(`Component ${name} not found`);
    }

    return (props: {
      query: FabrixComponentProps["query"];
      customProps: CP["component"] extends ComponentType<infer P> ? P : never;
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

  /**
   * Get the unit component by name.
   *
   * Specify type T that matches type type name of an unit component to get the correct type of the component.
   */
  getUnitComponentByName<T extends UnitComponentEntries["type"]>(name: string) {
    return this.props.custom?.unit?.[name]?.component as ComponentTypeByName<T>;
  }

  /**
   * Get the composite component by name.
   *
   * Specify type T that matches type type name of an composite component to get the correct type of the component.
   */
  getCompositeComponentByName<T extends ComponentEntries["type"]>(
    name: string,
  ) {
    return this.props.custom?.composite?.[name]
      ?.component as ComponentTypeByName<T>;
  }

  /**
   * Get the default component by type.
   */
  getDefaultComponentByType<T extends ComponentEntries["type"]>(type: T) {
    return this.props.default?.[type] as ComponentTypeByName<T>;
  }
}

export const emptyComponentRegistry = new ComponentRegistry({});
