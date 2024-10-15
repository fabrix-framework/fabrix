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
          mutation createTodo($input: TodoInput!) {
            addTodo(input: $input)
              @fabrixForm(
                input: [
                  { field: "id", config: { hidden: true } }
                  { field: "hasDone", config: { hidden: true } }
                  { field: "name", config: { gridCol: 9 } }
                  { field: "priority", config: { gridCol: 3 } }
                ]
              ) {
              id
            }
          }

          query todos {
            allTodos
              @fabrixView(
                input: [
                  { field: "collection", config: { label: "Your tasks" } }
                  { field: "collection.name", config: { label: "Task Name" } }
                  { field: "collection.id", config: { hidden: true } }
                  {
                    field: "collection.actions"
                    config: {
                      label: "操作"
                      componentType: {
                        name: "ActionCell"
                        props: [
                          { name: "label", value: "Done" }
                          { name: "color", value: "blue" }
                          { name: "mutation", value: "markTodoDone" }
                        ]
                      }
                    }
                  }
                ]
              ) {
              collection {
                id
                hasDone
                name
                priority
              }
            }
          }
        `}
      />
    </Stack>
  );
}

export default App;
