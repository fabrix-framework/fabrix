import { FabrixComponentData, useDataFetch } from "@fetcher";
import { ComponentEntry } from "@registry2";
import { FabrixComponentProps } from "@renderer";
import { DocumentResolver, Loader } from "@renderers/shared";
import { TableRenderer } from "@renderers2/table";

export type ComponentRendererProps<P extends ComponentEntry = ComponentEntry> =
  {
    name: string;
    entry: P;
    customProps?: unknown;
  };

type FabrixComponent2Props = FabrixComponentProps & {
  component: ComponentRendererProps;
};

export const FabrixComponent2 = (props: FabrixComponent2Props) => {
  const componentEntry = props.component.entry;

  switch (componentEntry.type) {
    // NOTE: Only table is implemented here as WIP
    case "table": {
      return (
        <DataFetcher
          documentResolver={() => props.query}
          variables={props.variables}
          defaultData={props.data}
        >
          {({ data }) => (
            <TableRenderer
              {...props}
              data={data}
              component={{
                name: props.component.name,
                entry: componentEntry,
                customProps: props.component.customProps,
              }}
            />
          )}
        </DataFetcher>
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
