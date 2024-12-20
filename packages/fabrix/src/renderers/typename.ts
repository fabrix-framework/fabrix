/*
 * A function extract the __typename field from the target value.
 *
 * Given a target value like this:
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
 *
 * Result can be as follows:
 * ```
 * {
 *   "user": "User",
 *   "user.address": "UserAddress",
 *   "user.contacts": "UserContact",
 * }
 * ```
 */
export const extractTypename = (targetValue: ObjectLikeValue2) => {
  if (!targetValue || typeof targetValue !== "object") {
    return null;
  }

  const result: Record<string, string> = {};
  const traverse = (value: NonNullable<ObjectLikeValue2>, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        traverse(item as typeof value, path);
      });
    } else if (value && typeof value === "object") {
      const typename = (value as { __typename?: string }).__typename;
      if (typeof typename === "string") {
        result[path] = typename;
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

  traverse(targetValue, "");
  return result;
};

export type ObjectLikeValue2 =
  | Record<string, unknown>
  | Record<string, Array<NonNullable<ObjectLikeValue2>>>
  | undefined;
