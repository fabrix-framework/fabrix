import { visit } from "graphql";
import { ExchangeIO, GraphQLRequest, makeOperation } from "urql";
import { pipe, map } from "wonka";

const removeDirectivesFromQuery = (
  query: GraphQLRequest["query"],
  directivesToRemove: string[],
) => {
  const modifiedQuery = visit(query, {
    Directive: (node) => {
      if (directivesToRemove.includes(node.name.value)) {
        return null;
      }
    },
  });

  return modifiedQuery;
};

// A custom exchange for urql to remove directives from requests to the server
export const removeDirectivesExchange =
  (directivesToRemove: string[]) =>
  (source: { forward: ExchangeIO }) =>
  (ops$: Parameters<ExchangeIO>[0]) => {
    return pipe(
      ops$,
      map((operation) => {
        return makeOperation(
          operation.kind,
          {
            // Create a new operation with the modified query
            ...operation,
            query: removeDirectivesFromQuery(
              operation.query,
              directivesToRemove,
            ),
          },
          operation.context,
        );
      }),
      source.forward,
    );
  };
