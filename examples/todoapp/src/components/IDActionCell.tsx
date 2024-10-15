import { Button } from "@chakra-ui/react";
import {
  TableCellComponentProps,
  useFabrixClient,
  useFabrixContext,
} from "@fabrix-framework/fabrix";
import { useCallback, useMemo, useState } from "react";

export const IDActionCell = {
  name: "IDActionCell",
  type: "tableCell",
  component: (props: TableCellComponentProps) => {
    const client = useFabrixClient();
    const context = useFabrixContext();
    const [isMutating, setMutating] = useState(false);
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
    const markDone = useCallback(async () => {
      const op = context.getMutation(values.mutation);
      if (!op) {
        return;
      }

      setMutating(true);
      try {
        await client.mutation(op, {
          input: {
            id: props.value.id,
          },
        });
      } catch (e) {
        console.error(e);
      } finally {
        setMutating(false);
      }
    }, [client, context, values, props]);

    return (
      <Button
        onClick={markDone}
        colorScheme={values.color}
        isDisabled={isMutating}
      >
        {values.label}
      </Button>
    );
  },
} as const;
