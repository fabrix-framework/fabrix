import {
  FabrixComponentData,
  useDataFetch,
  UseDataFetchResult,
} from "@fetcher";
import { ComponentEntry } from "@registry2";
import {
  FabrixComponentChildrenExtraProps,
  FabrixComponentChildrenProps,
  FabrixComponentProps,
  FieldConfig,
  useFieldConfigs,
} from "@renderer";
import { DocumentResolver, Loader } from "@renderers/shared";
import { FormRenderer } from "@renderers2/form";
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

function ensureFieldType<T extends FieldConfig["type"]>(
  fieldConfig: FieldConfig,
  type: T,
): asserts fieldConfig is FieldConfig & { type: T } {
  if (fieldConfig.type !== type) {
    throw new Error(`this component only supports ${type} type`);
  }
}

export const FabrixComponent2 = (props: FabrixComponent2Props) => {
  const { query } = props;
  const componentEntry = props.component.entry;
  const { fieldConfigs } = useFieldConfigs(query);

  const getRenderer = (
    fieldConfig: FieldConfig,
    fetcherResult: FetcherResult,
  ) => {
    // NOTE: Only table and form are implemented here as WIP
    switch (componentEntry.type) {
      case "table": {
        ensureFieldType(fieldConfig, "view");
        return (
          <TableRenderer
            {...props}
            key={`table-${fieldConfig.name}`}
            fieldConfig={fieldConfig}
            fetcherResult={fetcherResult}
            component={{
              name: props.component.name,
              entry: componentEntry,
              customProps: props.component.customProps,
            }}
          />
        );
      }
      case "form": {
        ensureFieldType(fieldConfig, "form");
        return (
          <FormRenderer
            {...props}
            key={`form-${fieldConfig.name}`}
            fieldConfig={fieldConfig}
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
          {(fetcherResult) =>
            Object.keys(fieldConfig.fields).map((key) =>
              getRenderer(fieldConfig.fields[key], fetcherResult),
            )
          }
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

export type FetcherResult = UseDataFetchResult;

const DataFetcher = (props: {
  documentResolver: DocumentResolver;
  variables: Record<string, unknown> | undefined;
  defaultData: FabrixComponentData | undefined;
  opType: OperationTypeNode;
  children: (props: FetcherResult) => React.ReactNode;
}) => {
  const result = useDataFetch({
    query: props.documentResolver(),
    variables: props.variables,
    defaultData: props.defaultData,
    pause: props.opType !== OperationTypeNode.QUERY,
  });

  if (result.fetching) {
    return <Loader />;
  }

  if (result.error) {
    throw result.error;
  }

  return props.children(result);
};
