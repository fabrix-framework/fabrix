import { Heading, Stack, HStack } from "@chakra-ui/react";
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
            <Stack>
              <p>hello</p>
              <HStack>
                <Field name="input.name" />
                <Field name="input.priority" />
                <Action />
              </HStack>
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
