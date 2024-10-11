import { Button } from "@chakra-ui/react";
import {
  gql,
  TableCellComponentProps,
  useFabrixClient,
} from "@fabrix-framework/fabrix";

export const ActionCell = {
  name: "ActionCell",
  type: "tableCell",
  component: (props: TableCellComponentProps) => {
    const client = useFabrixClient();
    const markDone = () => {
      client
        .mutation(
          gql`
            mutation ($input: TodoInput!) {
              markTodoDone(input: $input) {
                id
              }
            }
          `,
          {
            input: props.value,
          },
        )
        .then((result) => {
          console.log(result);
        });
    };

    return <Button onClick={markDone}>Done</Button>;
  },
} as const;
