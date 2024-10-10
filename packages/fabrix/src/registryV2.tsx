type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type FieldComponentProps<V> = {
  value: V;
};
type FieldComponentFunc<V> = (
  props: FieldComponentProps<V>,
) => React.ReactElement;

type EnumValue = {
  value: string;
  label: string;
};

type DefaultFieldComponents = {
  id: FieldComponentFunc<string>;
  string: FieldComponentFunc<string>;
  boolean: FieldComponentFunc<boolean>;
  number: FieldComponentFunc<number>;
  enum: FieldComponentFunc<Array<EnumValue>>;
  list: Omit<DefaultFieldComponents, "list">;
};
type CustomScalarComponents = Record<string, FieldComponentFunc<unknown>>;

type LayoutComponentProps = {
  value: Array<unknown>;
};
type LayoutComponentFunc = (
  props: React.PropsWithChildren<LayoutComponentProps>,
) => React.ReactElement;

type DefaultLayoutComponents = {
  form: LayoutComponentFunc;
  table: LayoutComponentFunc;
  view: LayoutComponentFunc;
};

export type ComponentRegistry = Partial<{
  default: Partial<{
    fields: Prettify<DefaultFieldComponents & CustomScalarComponents>;
    layouts: Partial<DefaultLayoutComponents>;
  }>;
}>;
