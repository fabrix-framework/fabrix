import { pipe, map } from "wonka";
import { Exchange } from "urql";
import { DocumentNode, visit, Kind } from "graphql";

export const addTypenameFieldExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      ops$,
      map((operation) => {
        if (operation.kind === "query" || operation.kind === "mutation") {
          operation.query = addTypenameField(operation.query);
        }
        return operation;
      }),
      forward,
    );
  };

const addTypenameField = (query: DocumentNode) => {
  return visit(query, {
    SelectionSet: (node, _, __, path) => {
      if (path.length === 3) {
        // Skip the root query
        return;
      }

      const hasTypename = node.selections.some((selection) => {
        if (selection.kind === Kind.FIELD) {
          return selection.name.value === "__typename";
        }
      });

      if (!hasTypename) {
        return {
          ...node,
          selections: [
            ...node.selections,
            {
              kind: "Field",
              name: { kind: "Name", value: "__typename" },
            },
          ],
        };
      }
      return node;
    },
  });
};
