import { Value } from "@fetcher";
import { CompositeComponentEntries } from "@registry";
import {
  FabrixComponentChildrenProps,
  FabrixComponentProps,
  FabrixGetOperationFn,
  FieldConfig,
  getComponentFn,
  getOperation,
  useFieldConfigs,
} from "@renderer";
import { CustomComponentTableRenderer } from "@renderers/custom/table";
import { ReactNode, useCallback } from "react";

export type ComponentRendererProps<
  C extends CompositeComponentEntries = CompositeComponentEntries,
> = {
  name: string;
  entry: C;
  customProps?: unknown;
};

export type FabrixCustomComponentProps = FabrixComponentProps & {
  component: ComponentRendererProps;
};

export const FabrixCustomComponent = (
  props: FabrixCustomComponentProps & {
    children?: (props: FabrixComponentChildrenProps) => ReactNode;
  },
) => {
  const { query } = props;
  const { fieldConfigs } = useFieldConfigs(query);
  const getComponent = getComponentFn(
    props,
    (fieldConfig: FieldConfig, data: Value) => {
      const componentEntry = props.component.entry;

      switch (componentEntry.type) {
        case "table": {
          ensureFieldType(fieldConfig, "view");
          return (
            <CustomComponentTableRenderer
              {...props}
              key={`table-${fieldConfig.name}`}
              fieldConfig={fieldConfig}
              data={data}
              component={{
                name: props.component.name,
                entry: componentEntry,
                customProps: props.component.customProps,
              }}
            />
          );
        }
        default: {
          throw new Error(`Unsupported component type: ${componentEntry.type}`);
        }
      }
    },
  );

  const getAppliedOperation: FabrixComponentChildrenProps["getOperation"] =
    useCallback(
      (indexOrName, renderer) => {
        return getOperation(
          {
            indexOrName,
            renderer: renderer as Parameters<FabrixGetOperationFn>[1],
            variables: props.variables,
            fieldConfigs,
          },
          getComponent,
        );
      },
      [fieldConfigs, props.variables],
    );

  const renderContents = () => {
    if (props.children) {
      return props.children({
        getOperation: getAppliedOperation,
        getComponent: (
          operationIndexOrName,
          rootFieldName,
          extraProps,
          fieldsRenderer,
        ) =>
          getAppliedOperation(operationIndexOrName, ({ getComponent }) =>
            getComponent(rootFieldName, extraProps, fieldsRenderer),
          ),
      });
    }

    return fieldConfigs.map((_, i) => getAppliedOperation(i));
  };

  return <div className="fabrix wrapper">{renderContents()}</div>;
};

function ensureFieldType<T extends FieldConfig["type"]>(
  fieldConfig: FieldConfig,
  type: T,
): asserts fieldConfig is FieldConfig & { type: T } {
  if (fieldConfig.type !== type) {
    throw new Error(`this component only supports ${type} type`);
  }
}
