import { DocumentNode } from "graphql";
import { useClient, useQuery } from "urql";

export const useDataFetch = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
>(props: {
  query: DocumentNode | string;
  variables?: Record<string, unknown>;
  pause?: boolean;
}) => {
  const [{ data, fetching, error }] = useQuery<TData>({
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
