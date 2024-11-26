import { ViewFieldSchema } from "@directive/schema";
import { FieldType } from "renderers/shared";
import React from "react";
import { DocumentNode, Kind, parse, visit } from "graphql";
import { SelectionField } from "@visitor/fields";

export type DirectiveAttributes = Pick<ViewFieldSchema, "label"> & {
  className: string;
};

type UserProps = Record<string, string | undefined>;
type CustomRendererProps<P extends UserProps> = {
  userProps?: P;
};

type BaseComponentProps<V = unknown> = {
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

/**
 * The component props that field renderer should implement.
 */
export type FieldComponentProps<P extends UserProps = UserProps> =
  BaseComponentProps &
    CustomRendererProps<P> & {
      subFields: Array<Field>;
    };

/**
 * The component props that table renderer should implement.
 */
export type TableComponentProps<P extends UserProps = UserProps> =
  CustomRendererProps<P> & {
    name?: string;
    className?: string;
    headers: TableComponentHeader[];
    values: Record<string, unknown>[];
  };
export type TableComponentHeader = Field & {
  render: ((rowValue: Record<string, unknown>) => React.ReactElement) | null;
};

/**
 * The component props that table cell renderer should implement.
 */
export type TableCellComponentProps<
  P extends UserProps = UserProps,
  V extends Record<string, unknown> = Record<string, unknown>,
> = BaseComponentProps<V> & CustomRendererProps<P>;

/**
 * The component props that form field renderer should implement.
 */
export type FormFieldComponentProps<P extends UserProps = UserProps> =
  BaseComponentProps &
    CustomRendererProps<P> & {
      isRequired: boolean;
    };

/**
 * The component props that form renderer should implement.
 */
export type FormComponentProps<P extends UserProps = UserProps> =
  CustomRendererProps<P> & {
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

type ComponentFunc<P> = (props: P) => React.ReactElement;

type CustomComponent =
  | {
      name: string;
      type: "field";
      component: ComponentFunc<FieldComponentProps>;
    }
  | {
      name: string;
      type: "formField";
      component: ComponentFunc<FormFieldComponentProps>;
    }
  | {
      name: string;
      type: "form";
      component: ComponentFunc<FormComponentProps>;
    }
  | {
      name: string;
      type: "table";
      component: ComponentFunc<TableComponentProps>;
    }
  | {
      name: string;
      type: "tableCell";
      component: ComponentFunc<TableCellComponentProps>;
    };

type ComponentFuncByType<T extends CustomComponent["type"]> = T extends "field"
  ? ComponentFunc<FieldComponentProps>
  : T extends "formField"
    ? ComponentFunc<FormFieldComponentProps>
    : T extends "form"
      ? ComponentFunc<FormComponentProps>
      : T extends "table"
        ? ComponentFunc<TableComponentProps>
        : T extends "tableCell"
          ? ComponentFunc<TableCellComponentProps>
          : never;

type ComponentRegistryConstructorProps = {
  custom?: Array<CustomComponent>;
  default?: {
    field?: ComponentFunc<FieldComponentProps>;
    form?: ComponentFunc<FormComponentProps>;
    formField?: ComponentFunc<FormFieldComponentProps>;
    table?: ComponentFunc<TableComponentProps>;
  };
};

type FragmentComponentProps<
  P extends Record<string, unknown> = Record<string, unknown>,
> = {
  values: P;
  fields: Array<Field>;
};

type AddFragmentComponentProps<
  P extends Record<string, unknown> = Record<string, unknown>,
> = {
  query: string | DocumentNode;
  component: ComponentFunc<FragmentComponentProps<P>>;
};

type FragmentComponentDefinition<
  P extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: string;
  baseType: string;
  fields: Array<SelectionField>;
  document: DocumentNode;
  component: ComponentFunc<FragmentComponentProps<P>>;
};

export class ComponentRegistry {
  private customComponentMap = new Map<string, CustomComponent["component"]>();
  private fragmentComponentMap = new Map<string, FragmentComponentDefinition>();

  constructor(readonly components: ComponentRegistryConstructorProps) {
    if (components.custom) {
      components.custom.forEach((e) => {
        this.customComponentMap.set(`${e.name}:${e.type}`, e.component);
      });
    }
  }

  merge(registry: ComponentRegistry) {
    const mergingRegistry = new ComponentRegistry({
      custom: [
        ...(this.components.custom ?? []),
        ...(registry.components.custom ?? []),
      ],
      default: {
        field:
          registry.components.default?.field ?? this.components.default?.field,
        form:
          registry.components.default?.form ?? this.components.default?.form,
        formField:
          registry.components.default?.formField ??
          this.components.default?.formField,
        table:
          registry.components.default?.table ?? this.components.default?.table,
      },
    });

    registry.getAllFragments().forEach((value) => {
      mergingRegistry.addFragment({
        query: value.document,
        component: value.component,
      });
    });

    return mergingRegistry;
  }

  getCustom<T extends CustomComponent["type"]>(name: string, type: T) {
    return this.customComponentMap.get(`${name}:${type}`) as
      | ComponentFuncByType<T>
      | undefined;
  }

  addFragment<P extends Record<string, unknown>>(
    props: AddFragmentComponentProps<P>,
  ) {
    let fragmentComponentDefinition =
      null as null | FragmentComponentDefinition<P>;
    const document =
      typeof props.query === "string" ? parse(props.query) : props.query;

    visit(document, {
      FragmentDefinition: (node) => {
        if (fragmentComponentDefinition !== null) {
          throw new Error(
            "Multiple fragment definitions in a single query is not supported",
          );
        }

        fragmentComponentDefinition = {
          name: node.name.value,
          baseType: node.typeCondition.name.value,
          fields: node.selectionSet.selections.flatMap<SelectionField>(
            (selection) => {
              switch (selection.kind) {
                case Kind.FIELD:
                  return [
                    {
                      type: "field",
                      name: selection.name.value,
                    },
                  ];
                default:
                  return [];
              }
            },
          ),
          document: document,
          component: props.component,
        };
      },
    });

    if (fragmentComponentDefinition === null) {
      throw new Error("No fragment definition found in the query");
    }

    this.fragmentComponentMap.set(
      fragmentComponentDefinition.name,
      fragmentComponentDefinition as FragmentComponentDefinition,
    );
  }

  getFragment(name: string) {
    return this.fragmentComponentMap.get(name);
  }

  getAllFragments() {
    return Array.from(this.fragmentComponentMap.values());
  }
}

export const emptyComponentRegistry = new ComponentRegistry({});
