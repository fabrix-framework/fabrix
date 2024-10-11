import { Heading, Stack } from "@chakra-ui/react";
import { FabrixComponent, gql } from "@fabrix-framework/fabrix";
import { css } from "@emotion/css";

const containerClassName = css`
  padding: 15px 0;
`;

function App() {
  return (
    <Stack padding={10}>
      <Heading textAlign="center" size="md">
        Fabrix TODO app example
      </Heading>
      <FabrixComponent
        containerClassName={containerClassName}
        query={gql`
          # mutation createTodo($input: TodoInput!) {
          #   addTodo(input: $input)
          #     @fabrixForm(
          #       input: [
          #         { field: "hasDone", config: { hidden: true } }
          #         { field: "name", config: { gridCol: 9 } }
          #         { field: "priority", config: { gridCol: 3 } }
          #       ]
          #     ) {
          #     id
          #   }
          # }

          query todos {
            allTodos
              @fabrixView(
                input: [
                  { field: "collection", config: { label: "Your tasks" } }
                  { field: "collection.actions", config: { label: "Actions" } }
                ]
              ) {
              collection {
                name
                priority
                hasDone
              }
            }
          }
        `}
      />
    </Stack>
  );
}

export default App;
