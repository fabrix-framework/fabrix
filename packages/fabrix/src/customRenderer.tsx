import { Value } from "@fetcher";
import { CompositeComponentEntries } from "@registry";
import {
  FabrixComponentProps,
  FieldConfig,
  getComponentFn,
  getComponentRendererFn,
} from "@renderer";
import { CustomComponentTableRenderer } from "@renderers/custom/table";

export type ComponentRendererProps<
  C extends CompositeComponentEntries = CompositeComponentEntries,
> = {
  name: string;
  entry: C;
  customProps?: unknown;
};

export const FabrixCustomComponent = (
  props: FabrixComponentProps & {
    component: ComponentRendererProps;
  },
) => {
  const renderComponent = getComponentRendererFn(
    props,
    getComponentFn(props, (fieldConfig: FieldConfig, data: Value) => {
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
    }),
  );

  return <div className="fabrix wrapper">{renderComponent()}</div>;
};

function ensureFieldType<T extends FieldConfig["type"]>(
  fieldConfig: FieldConfig,
  type: T,
): asserts fieldConfig is FieldConfig & { type: T } {
  if (fieldConfig.type !== type) {
    throw new Error(`this component only supports ${type} type`);
  }
}
