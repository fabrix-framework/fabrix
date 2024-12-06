import { CompositeComponentEntries } from "@registry";
import { FabrixComponentChildrenProps, FabrixComponentProps } from "@renderer";

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

export const FabrixCustomComponent = (
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: FabrixCustomComponentProps,
) => {
  throw new Error("Not implemented");
};
