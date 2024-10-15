import { Button } from "@chakra-ui/react";
import {
  TableCellComponentProps,
  useFabrixClient,
  useFabrixContext,
} from "@fabrix-framework/fabrix";
import { useCallback, useMemo } from "react";

export const ActionCell = {
  name: "ActionCell",
  type: "tableCell",
  component: (props: TableCellComponentProps) => {
    const client = useFabrixClient();
    const context = useFabrixContext();
    const values = useMemo(() => {
      const label = props.userProps?.["label"] ?? "Action";
      const color = props.userProps?.["color"] ?? "blue";
      const mutation = props.userProps?.["mutation"];
      if (!mutation) {
        throw new Error("Mutation is required");
      }

      return {
        label,
        color,
        mutation,
      };
    }, [props]);
    const markDone = useCallback(() => {
      const op = context.getMutation(values.mutation);
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
    }, [client, context, values, props]);

    return (
      <Button onClick={markDone} colorScheme={values.color}>
        {values.label}
      </Button>
    );
  },
} as const;
