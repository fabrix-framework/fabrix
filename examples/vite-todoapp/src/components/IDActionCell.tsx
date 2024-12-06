import { Button } from "@chakra-ui/react";
import {
  TableCellComponentProps,
  useFabrixClient,
  useFabrixContext,
} from "@fabrix-framework/fabrix";
import { useCallback, useState } from "react";

export const IDActionCell = {
  type: "tableCell",
  component: (props: TableCellComponentProps) => {
    const client = useFabrixClient();
    const context = useFabrixContext();
    const [isMutating, setMutating] = useState(false);
    const label = props.userProps?.["label"] ?? "Action";
    const color = props.userProps?.["color"] ?? "blue";
    const mutation = props.userProps?.["mutation"];
    if (!mutation) {
      throw new Error("Mutation is required");
    }

    const getMutatingID = () => {
      if (!props.value || typeof props.value !== "object") {
        return null;
      }
      return "id" in props.value ? props.value.id : null;
    };

    const mutate = useCallback(async () => {
      const op = context.getMutation(mutation);
      if (!op) {
        return;
      }

      setMutating(true);
      try {
        await client.mutation(op, {
          input: {
            id: getMutatingID(),
          },
        });
      } catch (e) {
        console.error(e);
      } finally {
        setMutating(false);
      }
    }, [client, context, props]);

    return (
      <Button onClick={mutate} colorScheme={color} isDisabled={isMutating}>
        {label}
      </Button>
    );
  },
} as const;
