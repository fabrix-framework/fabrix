import { Heading, Stack, Grid, GridItem } from "@chakra-ui/react";
import { FabrixComponent, gql } from "@fabrix-framework/fabrix";

const createTODOQuery = gql`
  mutation createTodo($input: TodoInput!) {
    addTodo(input: $input) {
      id
    }
  }
`;

function App() {
  return (
    <Stack padding={10}>
      <Heading textAlign="center" size="md">
        Fabrix TODO app example
      </Heading>
      <FabrixComponent query={createTODOQuery}>
        {({ getInput }) =>
          getInput({}, ({ Action, Field }) => (
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
                  <Field
                    name="input.priority"
                    extraProps={{ label: "優先度" }}
                  />
                </GridItem>
              </Grid>
              <Action />
            </Stack>
          ))
        }
      </FabrixComponent>
      <FabrixComponent
        query={gql`
          query todos {
            allTodos @fabrixView {
              collection {
                id
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
