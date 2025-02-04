import { DocumentNode } from "graphql";
import { AnyVariables, useClient, useQuery } from "urql";

export const useDataFetch = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TVariables = Record<string, any>,
>(props: {
  query: DocumentNode | string;
  variables: TVariables | undefined;
  pause?: boolean;
}) => {
  const [{ data, fetching, error }, executeQuery] = useQuery<TData>({
    query: props.query,
    variables: props.variables as AnyVariables,
    pause: props.pause,
  });

  return {
    fetching,
    error,
    data,
    refetch: executeQuery,
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
