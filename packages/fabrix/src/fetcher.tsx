import { addTypenameFieldExchange } from "@exchanges/addTypename";
import { removeDirectivesExchange } from "@exchanges/removeDirectives";
import { removeTypenameFromVariableExchange } from "@exchanges/removeTypenameFromVariable";
import { Loader } from "@renderers/shared";
import { DocumentNode } from "graphql";
import { ReactNode } from "react";
import { useClient, useQuery } from "urql";
import { Client as UrqlClient, fetchExchange, cacheExchange } from "urql";

export const useDataFetch = (props: FetcherProps) => {
  const [{ data, fetching, error }] = useQuery<FabrixComponentData>({
    query: props.query,
    variables: props.variables,
  });

  return {
    fetching,
    error,
    data,
  };
};

export type Value =
  | Record<string, FabrixComponentData>
  | Array<Record<string, FabrixComponentData>>;
export type FabrixComponentData = {
  [key: string]: Value;
};

export const useFabrixClient = () => {
  return useClient();
};

type FetcherProps = {
  query: DocumentNode | string;
  variables?: Record<string, unknown>;
};

type FabrixRequestResult = {
  data: FabrixComponentData | undefined;
  error: Error | undefined;
};

interface FabrixClient {
  getClient(): {
    mutate: (props: FetcherProps) => Promise<FabrixRequestResult>;
    query: (props: FetcherProps) => Promise<FabrixRequestResult>;
  };

  getFetcherComponent(): (
    props: FetcherProps & {
      children: (props: { data: FabrixComponentData | undefined }) => ReactNode;
    },
  ) => ReactNode;
}

export class URQLClient implements FabrixClient {
  private client: UrqlClient;

  constructor(private readonly url: string) {
    this.client = new UrqlClient({
      url,
      exchanges: [
        cacheExchange,
        removeDirectivesExchange(["fabrixView", "fabrixList", "fabrixForm"]),
        addTypenameFieldExchange,
        removeTypenameFromVariableExchange,
        fetchExchange,
      ],
    });
  }

  getClient() {
    return {
      mutate: async (props: FetcherProps) => {
        const r = await this.client.mutation<FabrixComponentData>(
          props.query,
          props.variables,
        );
        return {
          data: r.data,
          error: r.error,
        };
      },

      query: async (props: FetcherProps) => {
        const r = await this.client.query<FabrixComponentData>(
          props.query,
          props.variables,
        );
        return {
          data: r.data,
          error: r.error,
        };
      },
    };
  }

  getFetcherComponent() {
    return (
      props: FetcherProps & {
        children: (props: {
          data: FabrixComponentData | undefined;
        }) => ReactNode;
      },
    ) => {
      const [{ data, fetching, error }] = useQuery<FabrixComponentData>({
        query: props.query,
        variables: props.variables,
      });

      if (fetching || !data) {
        return <Loader />;
      }

      if (error) {
        throw error;
      }

      return props.children({ data });
    };
  }
}
