import { SchemaSet } from "@context";
import { GraphQLObjectType } from "graphql";
import { FieldType, resolveFieldType } from "./shared";

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
export const useTypenameExtractor = (props: {
  targetValue: ObjectLikeValue2;
  schemaSet: SchemaSet;
}) => {
  const { targetValue, schemaSet } = props;
  if (!targetValue || typeof targetValue !== "object") {
    return null;
  }

  const typenamesByPath: Record<string, string> = {};
  const traverse = (value: NonNullable<ObjectLikeValue2>, path: string) => {
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

  const resolveTypenameByPath = (path: string) => {
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
  };
};

export type ObjectLikeValue2 =
  | Record<string, unknown>
  | Record<string, Array<NonNullable<ObjectLikeValue2>>>
  | Array<NonNullable<ObjectLikeValue2>>
  | undefined;
