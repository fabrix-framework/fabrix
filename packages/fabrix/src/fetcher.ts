import { DocumentNode } from "graphql";
import { useClient, useQuery } from "urql";

export const useDataFetch = (props: {
  query: DocumentNode | string;
  variables?: Record<string, unknown>;
}) => {
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
