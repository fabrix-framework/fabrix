import { Button } from "@chakra-ui/react";
import {
  ComponentRegistry,
  gql,
  TableCellComponentProps,
  useFabrixClient,
} from "@fabrix-framework/fabrix";

const ActionCell = (props: TableCellComponentProps) => {
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
