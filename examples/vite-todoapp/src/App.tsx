import { Button, Heading, Stack } from "@chakra-ui/react";
import { FabrixComponent } from "@fabrix-framework/fabrix";
import { css } from "@emotion/css";
import { graphql } from "./graphql";

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
        query={graphql(`
          mutation createTodo($input: TodoInput!) {
            addTodo(input: $input) {
              id
            }
          }
        `)}
      >
        {({ getInput }) =>
          getInput({}, ({ Field, getAction }) => (
            <form {...getAction()}>
              <Field name="input.name" />
              <Field name="input.priority" />
              <Button type="submit">Add</Button>
            </form>
          ))
        }
      </FabrixComponent>
      <FabrixComponent
        containerClassName={containerClassName}
        query={graphql(`
          query todos {
            allTodos
              @fabrixView(
                input: [
                  { field: "collection", config: { label: "Your tasks" } }
                  { field: "collection.id", config: { hidden: true } }
                  { field: "collection.hasDone", config: { label: "Status" } }
                  {
                    field: "collection.actions"
                    config: {
                      label: "Actions"
                      index: -1
                      componentType: {
                        name: "IDActionCell"
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
                name
                priority
                hasDone
              }
            }
          }
        `)}
      />
    </Stack>
  );
}

export default App;
