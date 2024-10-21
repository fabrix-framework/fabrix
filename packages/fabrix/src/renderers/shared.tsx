import {
  DocumentNode,
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
} from "graphql";
import { DirectiveAttributes } from "@registry";
import { FabrixContextType } from "@context";
import { FieldWithDirective } from "@readers/shared";
import { FabrixComponentData } from "../fetcher";

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
export type CommonFabrixComponentRendererProps<T = Record<string, unknown>> = {
  query: RendererQuery;
  fieldConfigs: T;
  className?: string;
  defaultData: FabrixComponentData | undefined;
  context: FabrixContextType;
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
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

export type FieldTypes = ReturnType<typeof resolveFieldTypesFromTypename>;

export const getFieldConfigByKey = <C extends Record<string, unknown>>(
  fields: Array<FieldWithDirective<C>>,
  name: string,
) => fields.find((f) => f.field.asKey() == name);

export type ObjectLikeValue =
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | undefined;

/**
 * A helper function to resolve header types from the __typename field.
 */
export const resolveFieldTypesFromTypename = (
  context: FabrixContextType,
  values: ObjectLikeValue,
) => {
  if (!values) {
    return {};
  }

  const firstValue = Array.isArray(values) ? values[0] : values;
  if (
    !firstValue ||
    !("__typename" in firstValue) ||
    typeof firstValue.__typename !== "string"
  ) {
    return {};
  }

  if (context.schemaLoader.status === "loading") {
    return {};
  }

  const typeName = firstValue.__typename;
  const valueType =
    context.schemaLoader.schemaSet.serverSchema.getType(typeName);
  if (!(valueType instanceof GraphQLObjectType)) {
    return {};
  }

  const fields = valueType.getFields();
  return Object.keys(fields).reduce<Record<string, FieldType>>((acc, key) => {
    const field = fields[key];
    const typeInfo = resolveFieldType(field.type);
    if (!typeInfo) {
      return acc;
    }

    return {
      ...acc,
      [key]: typeInfo,
    };
  }, {});
};

type ScalarType = {
  type: "Scalar";
  name: string;
};

type EnumType = {
  type: "Enum";
  name: string;
  meta: {
    values: string[];
  };
};

type ObjectType = {
  type: "Object";
  name: string;
};

type ListType = {
  type: "List";
  innerType: NonNullable<FieldType>;
};

export type FieldType = ScalarType | EnumType | ObjectType | ListType | null;
export const defaultFieldType = {
  type: "Scalar" as const,
  name: "String",
};

export const resolveFieldType = (
  field: GraphQLOutputType | GraphQLNullableType,
): FieldType => {
  if (field instanceof GraphQLScalarType) {
    return {
      type: "Scalar" as const,
      name: field.name,
    };
  } else if (field instanceof GraphQLEnumType) {
    return {
      type: "Enum" as const,
      name: field.name,
      meta: {
        values: field.getValues().map((value) => value.name),
      },
    };
  } else if (field instanceof GraphQLObjectType) {
    return {
      type: "Object" as const,
      name: field.name,
    };
  } else if (field instanceof GraphQLList) {
    const innerType = resolveFieldType(field.ofType);
    if (!innerType) {
      return null;
    }

    return {
      type: "List" as const,
      innerType: innerType,
    };
  } else if (field instanceof GraphQLNonNull) {
    return resolveFieldType(field.ofType);
  } else {
    // Interface is not supported as well
    return null;
  }
};

export const Loader = () => {
  return (
    <div aria-busy="true" role="status">
      Loading...
    </div>
  );
};
