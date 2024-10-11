import { Button } from "@chakra-ui/react";
import {
  ComponentRegistry,
  TableCellComponentProps,
} from "@fabrix-framework/fabrix";

const ActionCell = (props: TableCellComponentProps) => {
  return (
    <Button
      onClick={() => {
        console.log("value", props.value);
      }}
    >
      Done
    </Button>
  );
};

export const TodoAppComponents = new ComponentRegistry({
  custom: [
    {
      name: "ActionCell",
      type: "tableCell",
      component: ActionCell,
    },
  ],
});
