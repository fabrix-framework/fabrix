import { CompositeComponentEntry } from "@registry";
import {
  FabrixComponentChildrenProps,
  FabrixComponentProps,
  useFieldConfigs,
} from "@renderer";

export type ComponentRendererProps<
  P extends CompositeComponentEntry = CompositeComponentEntry,
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

  return <div>Custom renderer</div>;
};
