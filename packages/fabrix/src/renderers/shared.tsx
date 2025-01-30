import { DocumentNode } from "graphql";
import { FabrixContextType } from "@context";
import { FieldConfigWithMeta } from "@readers/shared";
import { FieldConfig } from "@renderer";

export type DocumentResolver = () => string | DocumentNode;
export type RendererQuery = {
  rootName: string;
  variables: Record<string, unknown> | undefined;
  documentResolver: DocumentResolver;
};
export type CommonFabrixComponentRendererProps<F> = {
  context: FabrixContextType;
  fetching: boolean;
  error: Error | undefined;
  rootField: {
    name: string;
    fields: F;
    document: DocumentNode;
  };
  className?: string;
};

export const buildClassName = <
  T extends { gridCol: number | null | undefined },
>(
  fieldConfig: T,
  extraClassName?: string,
) => {
  return [
    "fabrix",
    "field",
    fieldConfig.gridCol ? `col-${fieldConfig.gridCol}` : null,
    extraClassName,
  ]
    .filter((v) => v)
    .join(" ");
};

export const assertArrayValue: (
  values: unknown,
) => asserts values is Array<Record<string, unknown>> = (values) => {
  if (!(values instanceof Array)) {
    throw new Error("invalid data type (expected array)");
  }
};

export const assertObjectValue: (
  value: unknown,
) => asserts value is Record<string, unknown> = (value) => {
  if (value instanceof Array) {
    throw new Error("invalid data type (expected object)");
  }
};

export type FieldConfigByType<T extends FieldConfig["type"]> = Extract<
  FieldConfig,
  { type: T }
>;

export const getFieldConfigByKey = <C extends Record<string, unknown>>(
  fields: Array<FieldConfigWithMeta<C>>,
  name: string,
) => fields.find((f) => f.field.asKey() == name);

export const Loader = () => {
  return (
    <div aria-busy="true" role="status">
      Loading...
    </div>
  );
};
