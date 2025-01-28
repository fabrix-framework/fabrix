import { CompositeComponentEntries } from "@registry";
import {
  FabrixComponentProps,
  FieldConfig,
  getComponentRendererFn,
  useOperation,
  getOutputComponentFn,
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
  const { operations } = useOperation(props.query);
  const operation = operations[0];
  if (!operation) {
    throw new Error(`No operation found`);
  }

  return (
    <div className="fabrix wrapper">
      {getComponentRendererFn(props, operation, () => {
        return {
          getInputComponent: () => () => null,
          getOutputComponent: getOutputComponentFn((renderFnProps) => {
            const { field, data } = renderFnProps;
            const componentEntry = props.component.entry;

            switch (componentEntry.type) {
              case "table": {
                ensureFieldType(field, "generic");
                return (
                  <CustomComponentTableRenderer
                    {...props}
                    key={`table-${field.name}`}
                    fieldConfig={field}
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
                throw new Error(
                  `Unsupported component type: ${componentEntry.type}`,
                );
              }
            }
          }),
          getActionComponent: () => () => null,
        };
      })()}
    </div>
  );
};

function ensureFieldType<T extends FieldConfig["type"]>(
  fieldConfig: FieldConfig,
  type: T,
): asserts fieldConfig is FieldConfig & { type: T } {
  if (fieldConfig.type !== type) {
    throw new Error(`this component only supports ${type} type`);
  }
}
