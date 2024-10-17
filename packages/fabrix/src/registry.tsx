import { ViewFieldSchema } from "@directive/schema";
import { FieldType } from "renderers/shared";
import React from "react";

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

type ComponentFunc<P> = (
  props: React.PropsWithChildren<P>,
) => React.ReactElement;

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

export class ComponentRegistry {
  private customComponentMap = new Map<string, CustomComponent["component"]>();

  constructor(readonly components: ComponentRegistryConstructorProps) {
    if (components.custom) {
      components.custom.forEach((e) => {
        this.customComponentMap.set(`${e.name}:${e.type}`, e.component);
      });
    }
  }

  merge(registry: ComponentRegistry) {
    return new ComponentRegistry({
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
  }

  getCustom<T extends CustomComponent["type"]>(name: string, type: T) {
    return this.customComponentMap.get(`${name}:${type}`) as
      | ComponentFuncByType<T>
      | undefined;
  }
}

export const emptyComponentRegistry = new ComponentRegistry({});
