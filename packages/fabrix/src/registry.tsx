import { ComponentType, ReactNode } from "react";
import { FabrixComponentProps } from "@renderer";
import { ViewFieldSchema } from "@directive/schema";
import { FieldType } from "@renderers/shared";
import { FabrixCustomComponent } from "@customRenderer";
import {
  ComponentTypeByName,
  KeyOf,
  MergeCustomComponentMap,
} from "@registry/utiltypes";

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

type FieldLikeComponentProps<V = unknown> = BaseComponentProps<V> & {
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
  FieldLikeComponentProps<Record<string, unknown>> & CustomRendererProps<UP>;

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

export type ComponentEntries = CompositeComponentEntries | UnitComponentEntries;

export type ComponentRegistryCustomProps<
  CC extends CompositeComponentMap = CompositeComponentMap,
  UC extends UnitComponentMap = UnitComponentMap,
> = {
  composite?: CC;
  unit?: UC;
};

export type ComponentRegistryProps<
  CC extends CompositeComponentMap,
  UC extends UnitComponentMap,
> = {
  custom?: ComponentRegistryCustomProps<CC, UC>;
  default?: {
    [K in ComponentEntries["type"]]?: ComponentTypeByName<K>;
  };
};

/**
 * Component registry is a class that holds the custom components and default components.
 *
 * ## Categories of components
 *
 * Component registry expects users to provide two categories of components: *custom* and *default*.
 * * *Custom components* are the components that users can define and use in their GraphQL query, or get the component through `getFabrixComponent` method.
 * * *Default components* are used when no component is specified or as fallback for the case when the custom component specified is not found.
 *
 * ## Custom components
 *
 * Custom components are divided into two categories: *composite* and *unit*.
 * * *Composite components* are the components that can have subfields. They are used to render the fields in the query.
 * * *Unit components* are the atomic components. Composite components can use unit components to render the fields, but unit components cannot have subfields.
 */
export class ComponentRegistry<
  P extends ComponentRegistryProps<
    CompositeComponentMap,
    UnitComponentMap
  > = ComponentRegistryProps<CompositeComponentMap, UnitComponentMap>,
> {
  constructor(private readonly props: P) {}

  /**
   * Merge the component registry with another component registry.
   */
  merge<
    MP extends ComponentRegistryProps<CompositeComponentMap, UnitComponentMap>,
  >(registry: ComponentRegistry<MP>) {
    return new ComponentRegistry({
      custom: {
        composite: {
          ...this.props.custom?.composite,
          ...registry.props.custom?.composite,
        } as MergeCustomComponentMap<P["custom"], MP["custom"], "composite">,
        unit: {
          ...this.props.custom?.unit,
          ...registry.props.custom?.unit,
        } as MergeCustomComponentMap<P["custom"], MP["custom"], "unit">,
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
   * This method creates a React component that wraps `FabrixComponent` with the custom component.
   *
   * The component takes a following props:
   * * `query`: The GraphQL query string.
   * * `customProps`: The custom props that the custom component requires.
   *
   * @param name The name of the custom composite component.
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

    return (
      props: FabrixComponentProps & {
        customProps: CP extends CompositeComponentEntries<infer P> ? P : never;
      },
    ) => (
      <FabrixCustomComponent
        {...props}
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
   * Get the component by name.
   *
   * If the component is not found, it will return the default component.
   *
   * @param name The name of the component.
   * @param type The type of the component.
   */
  getCustomComponentByNameWithFallback<T extends ComponentEntries["type"]>(
    name: string | null | undefined,
    type: T,
  ) {
    const customComponents: Record<string, ComponentEntries> = {
      ...this.props.custom?.composite,
      ...this.props.custom?.unit,
    };

    const cc = customComponents[name ?? ""];
    if (!cc) {
      return this.getDefaultComponentByType(type);
    }

    return cc.component as unknown as ComponentTypeByName<T>;
  }

  /**
   * Get the default component by type.
   */
  getDefaultComponentByType<T extends ComponentEntries["type"]>(type: T) {
    return this.props.default?.[type] as ComponentTypeByName<T>;
  }
}

export const emptyComponentRegistry = new ComponentRegistry({});
