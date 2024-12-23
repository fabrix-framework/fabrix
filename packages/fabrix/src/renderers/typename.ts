import { SchemaSet } from "@context";
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLNullableType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLType,
} from "graphql";
import { Path } from "@visitor/path";

/*
 * A function extract the __typename field from the target value.
 *
 * `targetValue` param like this:
 * ```
 * {
 *   user: {
 *    id: "1",
 *    name: "John",
 *    address: {
 *      city: "New York",
 *      __typename: "UserAddress",
 *    },
 *    contacts: [
 *      {
 *        email: "john@example.com"
 *        __typename: "UserContact",
 *      }
 *    ],
 *     __typename: "User",
 *   }
 * }
 * ```
 */
export const buildTypenameExtractor = (props: {
  targetValue: ObjectLikeValue;
  schemaSet: SchemaSet;
}) => {
  const { targetValue, schemaSet } = props;
  const typenamesByPath: Record<string, string> = {};
  const traverse = (value: ObjectLikeValue, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        traverse(item as typeof value, path);
      });
    } else if (value && typeof value === "object") {
      const typename = (value as { __typename?: string }).__typename;
      if (typeof typename === "string") {
        typenamesByPath[path] = typename;
      }
      for (const key of Object.keys(value)) {
        if (key !== "__typename") {
          traverse(
            value[key] as Record<string, unknown>,
            path ? `${path}.${key}` : key,
          );
        }
      }
    }
  };

  const resolveTypenameByPath = (path: string | undefined) => {
    if (!path) {
      return {};
    }

    const typename = typenamesByPath[path];
    const valueType = schemaSet.serverSchema.getType(typename);
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

  const getFieldTypeByPath = (path: Path) => {
    const parentKey = path.getParent()?.asKey();
    const typeInfo = resolveTypenameByPath(parentKey);
    const fieldName = path.getName();
    return typeInfo[fieldName] ?? null;
  };

  traverse(targetValue, "");

  return {
    /**
     * A function to resolve the type information by the path.
     *
     * With this input:
     * ```
     * {
     *   user: {
     *     id: "1",
     *      name: "John",
     *     address: {
     *       city: "New York",
     *       __typename: "UserAddress",
     *     },
     *   },
     * }
     * ```
     *
     * If you call `resolveTypenameByPath("user.address")`, you will get the following result:
     * ```
     * {
     *   "city: { type: "Scalar", name: "String" },
     * }
     * ```
     */
    resolveTypenameByPath,

    /**
     * A map of the __typename field by the path.
     *
     * For example, the result can be as follows:
     * ```
     * {
     *   "user": "User",
     *   "user.address": "UserAddress",
     *   "user.contacts": "UserContact",
     * }
     * ```
     */
    typenamesByPath,

    /**
     * A function to get the field type by the path.
     */
    getFieldTypeByPath,
  };
};

export type TypenameExtractor = ReturnType<typeof buildTypenameExtractor>;

type ObjectLikeValue =
  | Record<string, unknown>
  | Record<string, Array<NonNullable<ObjectLikeValue>>>
  | Array<NonNullable<ObjectLikeValue>>
  | undefined;

const newScalarTypeField = (field: GraphQLScalarType) => {
  return {
    type: "Scalar" as const,
    name: field.name,
  };
};

const newEnumTypeField = (field: GraphQLEnumType) => {
  return {
    type: "Enum" as const,
    name: field.name,
    meta: {
      values: field.getValues().map((value) => value.name),
    },
  };
};

const newObjectTypeField = (field: GraphQLObjectType) => {
  return {
    type: "Object" as const,
    name: field.name,
  };
};

const newListTypeField = (field: GraphQLList<GraphQLType>) => {
  const innerType = resolveFieldType(field.ofType);
  if (!innerType) {
    return null;
  }

  return {
    type: "List" as const,
    innerType: innerType,
  };
};

type ScalarType = ReturnType<typeof newScalarTypeField>;
type EnumType = ReturnType<typeof newEnumTypeField>;
type ObjectType = ReturnType<typeof newObjectTypeField>;
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
    return newScalarTypeField(field);
  } else if (field instanceof GraphQLEnumType) {
    return newEnumTypeField(field);
  } else if (field instanceof GraphQLObjectType) {
    return newObjectTypeField(field);
  } else if (field instanceof GraphQLList) {
    return newListTypeField(field);
  } else if (field instanceof GraphQLNonNull) {
    return resolveFieldType(field.ofType);
  } else {
    // Interface is not supported as well
    return null;
  }
};
