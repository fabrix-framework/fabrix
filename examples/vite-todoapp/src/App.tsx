import { Heading, Stack, Grid, GridItem } from "@chakra-ui/react";
import { FabrixComponent } from "@fabrix-framework/fabrix";
import { graphql } from "./graphql";

const NewTodoForm = () => (
  <FabrixComponent
    query={graphql(`
      mutation addTodo($input: TodoInput!) {
        addTodo(input: $input) {
          id
        }
      }
    `)}
  >
    {({ getInput }) =>
      getInput({}, ({ Action, Field }) => {
        return (
          <Stack gridColumn={"1/12"}>
            <Grid
              templateColumns={"repeat(6, 1fr)"}
              gap={3}
              autoFlow={"column"}
            >
              <GridItem colSpan={4}>
                <Field name="input.name" extraProps={{ label: "タスク名" }} />
              </GridItem>
              <GridItem colSpan={2}>
                <Field name="input.priority" extraProps={{ label: "優先度" }} />
              </GridItem>
            </Grid>
            <Action />
          </Stack>
        );
      })
    }
  </FabrixComponent>
);

const TodoList = () => (
  <FabrixComponent
    query={graphql(`
      query allTodos {
        allTodos {
          collection {
            id
            name
            priority
            hasDone
          }
        }
      }
    `)}
  >
    {({ getOutput }) => (
      <Stack>
        <Heading size="sm">TODO List</Heading>
        {getOutput("allTodos")}
      </Stack>
    )}
  </FabrixComponent>
);

const App = () => {
  return (
    <Stack padding={10}>
      <Heading textAlign="center" size="md">
        Fabrix TODO app example
      </Heading>
      <NewTodoForm />
      <TodoList />
    </Stack>
  );
};

export default App;
