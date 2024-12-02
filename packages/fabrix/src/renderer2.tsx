import { FabrixComponentData, useDataFetch } from "@fetcher";
import { ComponentEntry } from "@registry2";
import {
  FabrixComponentChildrenExtraProps,
  FabrixComponentChildrenProps,
  FabrixComponentProps,
  FieldConfigs,
  useFieldConfigs,
} from "@renderer";
import { DocumentResolver, Loader } from "@renderers/shared";
import { TableRenderer } from "@renderers2/table";
import { OperationTypeNode } from "graphql";

export type ComponentRendererProps<P extends ComponentEntry = ComponentEntry> =
  {
    name: string;
    entry: P;
    customProps?: unknown;
  };

export type FabrixComponent2Props = FabrixComponentProps & {
  component: ComponentRendererProps;
  children?: (props: FabrixComponentChildrenProps) => React.ReactNode;
};

export const FabrixComponent2 = (props: FabrixComponent2Props) => {
  const { query, ...restProps } = props;
  const componentEntry = props.component.entry;
  const { fieldConfigs } = useFieldConfigs(query);

  const renderComponent = (
    fieldConfigs: FieldConfigs,
    data: FabrixComponentData | undefined,
  ) => {
    switch (componentEntry.type) {
      // NOTE: Only table is implemented here as WIP
      case "table": {
        return (
          <TableRenderer
            {...restProps}
            fieldConfigs={fieldConfigs}
            data={data}
            component={{
              name: props.component.name,
              entry: componentEntry,
              customProps: props.component.customProps,
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  const getComponent = (
    name: string,
    extraProps?: FabrixComponentChildrenExtraProps,
  ) => {
    const fieldConfig = fieldConfigs.find((c) => c.name === name);
    if (!fieldConfig) {
      throw new Error(`Component not found for ${name}`);
    }

    return (
      <div
        key={extraProps?.key}
        className={`fabrix renderer container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
      >
        <DataFetcher
          documentResolver={() => props.query}
          variables={props.variables}
          defaultData={props.data}
          opType={fieldConfig.opType}
        >
          {({ data }) => renderComponent(fieldConfig.fields, data)}
        </DataFetcher>
      </div>
    );
  };

  const renderContents = () => {
    if (props.children) {
      return props.children({
        getComponent,
      });
    }

    return fieldConfigs.map((c, index) =>
      getComponent(c.name, { key: `renderer-${index}` }),
    );
  };

  return <div className="fabrix wrapper">{renderContents()}</div>;
};

const DataFetcher = (props: {
  documentResolver: DocumentResolver;
  variables: Record<string, unknown> | undefined;
  defaultData: FabrixComponentData | undefined;
  opType: OperationTypeNode;
  children: (props: {
    data: FabrixComponentData | undefined;
  }) => React.ReactNode;
}) => {
  const { fetching, error, data } = useDataFetch({
    query: props.documentResolver(),
    variables: props.variables,
    defaultData: props.defaultData,
    pause: props.opType !== OperationTypeNode.QUERY,
  });

  if (fetching) {
    return <Loader />;
  }

  if (error) {
    throw error;
  }

  return props.children({ data });
};
