import {
  DocumentNode,
  parse,
  getIntrospectionQuery,
  buildClientSchema,
  IntrospectionQuery,
  GraphQLSchema,
  buildSchema,
} from "graphql";
import { createContext, useContext } from "react";
import { ComponentRegistry, emptyComponentRegistry } from "./registry";

type SchemaSet = {
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
  return useContext(FabrixContext);
};

export type BuildFabrixContextProps = {
  /**
   * The URL of the GraphQL server to connect to.
   *
   * This prop will be used to fetch the schema of the server if the `serverSchema` is not provided.
   */
  url: string;

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

export const buildSchemaSet = async (
  props: BuildFabrixContextProps,
): Promise<SchemaSet> => {
  const resolvedServerSchema = await resolveServerSchema(
    props.serverSchema ?? props.url,
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
};

const resolveServerSchema = async (
  input: GraphQLSchema | string,
): Promise<GraphQLSchema> => {
  if (
    typeof input === "string" &&
    (input.startsWith("https://") || input.startsWith("http://"))
  ) {
    const introspectionQuery = getIntrospectionQuery();
    const result = await fetch(input, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: introspectionQuery }),
    });

    const { data } = (await result.json()) as { data: IntrospectionQuery };
    return buildClientSchema(data);
  }

  return typeof input === "string" ? buildSchema(input) : input;
};
