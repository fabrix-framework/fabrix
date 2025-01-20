import { DocumentNode } from "graphql";
import { useClient, useQuery } from "urql";

export const useDataFetch = (props: {
  query: DocumentNode | string;
  variables?: Record<string, unknown>;
  pause?: boolean;
}) => {
  const [{ data, fetching, error }] = useQuery<FabrixComponentData>({
    ...props,
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
