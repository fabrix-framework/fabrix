import { FabrixComponentData } from "@fetcher";
import { CompositeComponentEntries } from "@registry";
import {
  FabrixComponentProps,
  FieldConfig,
  FieldConfigs,
  getOperation,
  useFieldConfigs,
} from "@renderer";
import { CustomComponentTableRenderer } from "@renderers/custom/table";
import { useCallback } from "react";

export type ComponentRendererProps<
  P extends CompositeComponentEntries = CompositeComponentEntries,
> = {
  name: string;
  entry: P;
  customProps?: unknown;
};

export type FabrixCustomComponentProps = FabrixComponentProps & {
  component: ComponentRendererProps;
};

export const FabrixCustomComponent = (props: FabrixCustomComponentProps) => {
  const { query } = props;
  const componentEntry = props.component.entry;
  const { fieldConfigs } = useFieldConfigs(query);

  const renderComponent = (
    fieldConfig: FieldConfig,
    data: FabrixComponentData,
  ) => {
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
  };

  const getAppliedOperation = useCallback(
    (index: number) => {
      return getOperation(
        {
          // NOTE: FabrixCustomComponent does not support children renderer (renederer: undefined)
          //
          indexOrName: index,
          fieldConfigs,
          variables: undefined,
          renderer: undefined,
        },
        (fieldConfig: FieldConfigs, data: FabrixComponentData) => {
          // Implemenation for `getComponent` function caller
          return (name: string) => {
            const field = fieldConfig.fields.find((f) => f.name === name);
            if (!field) {
              throw new Error(`No root field found for name: ${name}`);
            }

            return renderComponent(field, data);
          };
        },
      );
    },
    [fieldConfigs],
  );

  const renderContents = () =>
    fieldConfigs.map((_, i) => getAppliedOperation(i));

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
