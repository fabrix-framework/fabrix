import { FabrixComponentData, useDataFetch } from "@fetcher";
import { ComponentEntry } from "@registry2";
import { FabrixComponentProps, useFieldConfigs } from "@renderer";
import { DocumentResolver, Loader } from "@renderers/shared";

export const FabrixComponent2 = (
  props: FabrixComponentProps & {
    componentType: Exclude<
      ComponentEntry["type"],
      "field" | "formField" | "tableCell"
    >;
  },
) => {
  switch (props.componentType) {
    // NOTE: Only table is implemented here as WIP
    case "table": {
      return (
        <DataFetcher
          documentResolver={() => props.query}
          variables={props.variables}
          defaultData={props.data}
        >
          {({ data }) => <TableRenderer {...props} data={data} />}
        </DataFetcher>
      );
    }
    default:
      return null;
  }
};

const TableRenderer = (props: FabrixComponentProps) => {
  const { fieldConfigs } = useFieldConfigs(props.query);

  if (fieldConfigs.length > 1 || fieldConfigs.length === 0) {
    throw new Error("Table requires only one field at the root level");
  }
  const fielConfig = fieldConfigs[0];
  const fieldKeys = Object.keys(fielConfig);

  const tableComponents = fieldKeys.map((key) => {
    const field = fielConfig[key];
    if (field.type !== "view") {
      throw new Error("Table requires only view fields");
    }

    return <div>TableRender</div>;
  });

  return (
    <>
      <h1>query</h1>
      <div>{tableComponents}</div>
    </>
  );
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
