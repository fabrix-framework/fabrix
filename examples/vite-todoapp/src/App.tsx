import { Heading, Stack, Grid, GridItem } from "@chakra-ui/react";
import { FabrixComponent, gql } from "@fabrix-framework/fabrix";

const NewTodoForm = () => (
  <FabrixComponent
    query={gql`
      mutation ($input: TodoInput!) {
        addTodo(input: $input) {
          id
        }
      }
    `}
  >
    {({ getInput }) =>
      getInput({}, ({ Action, Field }) => (
        <Stack gridColumn={"1/12"}>
          <Grid templateColumns={"repeat(6, 1fr)"} gap={3} autoFlow={"column"}>
            <GridItem colSpan={4}>
              <Field name="input.name" extraProps={{ label: "タスク名" }} />
            </GridItem>
            <GridItem colSpan={2}>
              <Field name="input.priority" extraProps={{ label: "優先度" }} />
            </GridItem>
          </Grid>
          <Action />
        </Stack>
      ))
    }
  </FabrixComponent>
);

const TodoList = () => (
  <FabrixComponent
    query={gql`
      query {
        allTodos {
          collection {
            id
            name
            priority
            hasDone
          }
        }
      }
    `}
  >
    {({ getOutput }) => getOutput("allTodos")}
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
