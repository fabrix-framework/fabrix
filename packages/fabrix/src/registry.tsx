import { ViewFieldSchema } from "@directive/schema";
import { FieldType } from "renderers/shared";
import React from "react";
import { SubField } from "@renderers/fields";

export type DirectiveAttributes = Pick<ViewFieldSchema, "label"> & {
  className: string;
};

type UserProps = Record<string, string | undefined>;
type CustomRendererProps<P extends UserProps> = {
  userProps?: P;
};

type BaseComponentProps = {
  name: string;
  value: unknown;
  type: FieldType;
  attributes: DirectiveAttributes;
};

/**
 * The component props that field renderer should implement.
 */
export type FieldComponentProps<P extends UserProps = UserProps> =
  BaseComponentProps &
    CustomRendererProps<P> & {
      subFields: Array<SubField>;
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
export type TableComponentHeader = {
  key: string;
  label: string;
  type: FieldType;
};

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
      type: "field";
      component: ComponentFunc<FieldComponentProps>;
    }
  | {
      type: "formField";
      component: ComponentFunc<FormFieldComponentProps>;
    }
  | {
      type: "form";
      component: ComponentFunc<FormComponentProps>;
    }
  | {
      type: "table";
      component: ComponentFunc<TableComponentProps>;
    };

type ComponentFuncByType<T extends CustomComponent["type"]> = T extends "field"
  ? ComponentFunc<FieldComponentProps>
  : T extends "formField"
    ? ComponentFunc<FormFieldComponentProps>
    : T extends "form"
      ? ComponentFunc<FormComponentProps>
      : T extends "table"
        ? ComponentFunc<TableComponentProps>
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
        const c = e.component;
        this.customComponentMap.set(`${c.name}:${e.type}`, c);
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
