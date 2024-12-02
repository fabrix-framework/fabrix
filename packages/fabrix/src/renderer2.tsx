import { FabrixComponentData, useDataFetch } from "@fetcher";
import { ComponentEntry } from "@registry2";
import { FabrixComponentProps, useFieldConfigs } from "@renderer";
import { DocumentResolver, Loader } from "@renderers/shared";

const FabrixComponent2 = (
  props: FabrixComponentProps & {
    componentType: Exclude<
      ComponentEntry["type"],
      "field" | "formField" | "tableCell"
    >;
  },
) => {
  const fieldConfigs = useFieldConfigs(props.query);

  switch (props.componentType) {
    case "table": {
      return (
        <DataFetcher
          documentResolver={() => props.query}
          variables={props.variables}
          defaultData={props.data}
        >
          {({ data }) => {
            return (
              <>
                <h1>query</h1>
                <div>{props.componentType}</div>
              </>
            );
          }}
        </DataFetcher>
      );
    }
    case "form": {
      return (
        <>
          <h1>form</h1>
          <div>{props.componentType}</div>
        </>
      );
    }
    default:
      return null;
  }
};

const DataFetcher = (props: {
  documentResolver: DocumentResolver;
  variables: Record<string, unknown> | undefined;
  defaultData: FabrixComponentData | undefined;
  children: (props: {
    data: FabrixComponentData | undefined;
  }) => React.ReactNode;
}) => {
  const { fetching, error, data } = useDataFetch({
    query: props.documentResolver(),
    variables: props.variables,
    defaultData: props.defaultData,
  });

  if (fetching) {
    return <Loader />;
  }

  if (error) {
    throw error;
  }

  return props.children({ data });
};
