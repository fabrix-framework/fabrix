import { deepmerge } from "deepmerge-ts";
import { DocumentNode } from "graphql";
import { useMemo } from "react";
import { useClient, useQuery } from "urql";

export const useDataFetch = (props: {
  query: DocumentNode | string;
  variables?: Record<string, unknown>;
  defaultData?: FabrixComponentData;
  pause?: boolean;
}) => {
  const { defaultData, ...queryProps } = props;

  // Stop the query from executing automatically by enabling the `pause` option.
  // when the `defaultData` prop is provided.
  const [{ data: queryData, fetching, error }] = useQuery<FabrixComponentData>({
    ...queryProps,
  });

  const renderingData = useMemo(
    () => deepmerge(queryData, props.defaultData),
    [props.defaultData, queryData],
  );

  return {
    fetching,
    error,
    data: renderingData,
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
