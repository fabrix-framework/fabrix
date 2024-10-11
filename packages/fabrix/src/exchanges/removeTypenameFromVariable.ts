import { AnyVariables, Exchange, makeOperation } from "urql";
import { pipe, map } from "wonka";

const removeTypename = (value: AnyVariables): AnyVariables => {
  if (Array.isArray(value)) {
    return value.map(removeTypename);
  } else if (value !== null && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      if (key === "__typename") {
        return acc;
      }
      return {
        ...acc,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        [key]: removeTypename(value[key]),
      };
    }, {});
  }
  return value;
};

export const removeTypenameFromVariableExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      ops$,
      map((operation) => {
        if (operation.kind === "mutation") {
          return makeOperation(
            operation.kind,
            {
              ...operation,
              variables: removeTypename(operation.variables),
            },
            operation.context,
          );
        }
        return operation;
      }),
      forward,
    );
  };
