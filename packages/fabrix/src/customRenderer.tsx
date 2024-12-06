import { CompositeComponentEntry } from "@registry2";
import { FabrixComponentChildrenProps, FabrixComponentProps } from "@renderer";

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
  return <div>Custom renderer</div>;
};
