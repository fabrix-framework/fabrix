import { Button } from "@chakra-ui/react";
import {
  TableCellComponentProps,
  useFabrixClient,
  useFabrixContext,
} from "@fabrix-framework/fabrix";

export const ActionCell = {
  name: "ActionCell",
  type: "tableCell",
  component: (props: TableCellComponentProps) => {
    const client = useFabrixClient();
    const context = useFabrixContext();
    const markDone = () => {
      const op = context.getMutation("markTodoDone");
      if (!op) {
        return;
      }

      client
        .mutation(op, {
          input: props.value,
        })
        .then((result) => {
          console.log(result);
        });
    };

    return <Button onClick={markDone}>Done</Button>;
  },
} as const;
