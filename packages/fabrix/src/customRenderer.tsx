import { FabrixComponentData } from "@fetcher";
import { CompositeComponentEntries } from "@registry";
import {
  FabrixComponentChildrenProps,
  FabrixComponentProps,
  FieldConfig,
  FieldConfigs,
  getOperation,
  useFieldConfigs,
} from "@renderer";
import { FieldsRenderer } from "@renderers/custom/fields";
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
  children?: (props: FabrixComponentChildrenProps) => React.ReactNode;
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
      case "fields": {
        ensureFieldType(fieldConfig, "view");
        return (
          <FieldsRenderer
            {...props}
            key={`fields-${fieldConfig.name}`}
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
        return null;
      }
    }
  };

  const getAppliedOperation = useCallback(
    (index: number) => {
      return getOperation(
        {
          // NOTE: FabrixCustomComponent does not support custom renderer
          indexOrName: index,
          variables: {},
          fieldConfigs,
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
