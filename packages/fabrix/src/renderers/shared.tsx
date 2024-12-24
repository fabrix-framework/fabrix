import { DocumentNode } from "graphql";
import { DirectiveAttributes } from "@registry";
import { FabrixContextType } from "@context";
import { FieldConfigWithMeta } from "@readers/shared";
import { FieldConfig } from "@renderer";
import { Value } from "@fetcher";

type FabrixComponentFieldsRendererExtraProps = Partial<DirectiveAttributes> & {
  key?: string;
};
export type FabrixComponentFieldsRenderer = (props: {
  /**
   * Get the field by name
   *
   * ```tsx
   * <FabrixComponent query={appQuery}>
   *   {({ getComponent }) => (
   *     <>
   *       {getComponent("getEmployee", {}, ({ getField }) => (
   *         <>
   *           {getField("displayName")}
   *           {getField("email")}
   *         </>
   *       ))}
   *     </>
   *   )}
   * </FabrixComponent>
   * ```
   */
  getField: (
    /**
     * The name of the field
     */
    name: string,
    extraProps?: FabrixComponentFieldsRendererExtraProps,
  ) => React.ReactNode;
}) => React.ReactNode;

export type DocumentResolver = () => string | DocumentNode;
export type RendererQuery = {
  rootName: string;
  variables: Record<string, unknown> | undefined;
  documentResolver: DocumentResolver;
};
export type CommonFabrixComponentRendererProps<F> = {
  context: FabrixContextType;
  rootField: {
    name: string;
    fields: F;
    data: Value;
    document: DocumentNode;
  };
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
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
