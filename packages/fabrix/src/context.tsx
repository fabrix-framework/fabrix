import {
  DocumentNode,
  parse,
  getIntrospectionQuery,
  buildClientSchema,
  IntrospectionQuery,
  GraphQLSchema,
  buildSchema,
  Kind,
  OperationTypeNode,
} from "graphql";
import { createContext, useCallback, useContext } from "react";
import { ComponentRegistry, emptyComponentRegistry } from "@registry";
import { Client as UrqlClient, useClient } from "urql";

export type SchemaSet = {
  serverSchema: GraphQLSchema;
  operationSchema?: DocumentNode;
};

export type SchemaLoader =
  | {
      status: "loading";
    }
  | {
      status: "loaded";
      schemaSet: SchemaSet;
    };

export type FabrixContextType = {
  schemaLoader: SchemaLoader;
  componentRegistry: ComponentRegistry;
};

export const FabrixContext = createContext<FabrixContextType>({
  schemaLoader: {
    status: "loading",
  },
  componentRegistry: emptyComponentRegistry,
});

/**
 * Hook to access the Fabrix context.
 */
export const useFabrixContext = () => {
  const context = useContext(FabrixContext);
  const getOperation = (opType: OperationTypeNode, name: string) => {
    if (context.schemaLoader.status === "loading") {
      return;
    }

    const opSchema = context.schemaLoader.schemaSet.operationSchema;
    return opSchema?.definitions.find((def) => {
      if (
        def.kind === Kind.OPERATION_DEFINITION &&
        def.operation === opType &&
        def.name?.value === name
      ) {
        return true;
      }
    });
  };

  const getMutation = useCallback(
    (name: string): DocumentNode | null => {
      const op = getOperation(OperationTypeNode.MUTATION, name);
      if (!op) {
        return null;
      }

      return {
        kind: Kind.DOCUMENT,
        definitions: [op],
      };
    },
    [context],
  );
  const getQuery = useCallback(
    (name: string): DocumentNode | null => {
      const op = getOperation(OperationTypeNode.QUERY, name);
      if (!op) {
        return null;
      }

      return {
        kind: Kind.DOCUMENT,
        definitions: [op],
      };
    },
    [context],
  );

  return {
    getMutation,
    getQuery,
  };
};

export type BuildFabrixContextProps = {
  /**
   * The schema of the server.
   *
   * If the schema is a URL, the schema will be fetched from the URL through introspection query.
   */
  serverSchema?: SchemaSet["serverSchema"] | string;

  /**
   * The schema of the frontend operations.
   */
  operationSchema?: SchemaSet["operationSchema"] | string;

  /**
   * The elements to be used in the Fabrix context.
   */
  componentRegistry: ComponentRegistry;
};

export const useSchemaSetBuilder = (props: BuildFabrixContextProps) => {
  const urqlClient = useClient();

  return {
    build: async () => {
      const resolvedServerSchema = await resolveServerSchema(
        urqlClient,
        props.serverSchema,
      );

      return {
        serverSchema: resolvedServerSchema,
        operationSchema:
          props.operationSchema !== undefined
            ? typeof props.operationSchema === "string"
              ? parse(props.operationSchema)
              : props.operationSchema
            : undefined,
      };
    },
  };
};

const resolveServerSchema = async (
  client: UrqlClient,
  serverSchema: BuildFabrixContextProps["serverSchema"],
): Promise<GraphQLSchema> => {
  if (!serverSchema) {
    const r = await client.query(getIntrospectionQuery(), {});
    return buildClientSchema(r.data as IntrospectionQuery);
  }

  return typeof serverSchema === "string"
    ? buildSchema(serverSchema)
    : serverSchema;
};
