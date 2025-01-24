import { Heading, Stack, HStack } from "@chakra-ui/react";
import { FabrixComponent, gql } from "@fabrix-framework/fabrix";
import { css } from "@emotion/css";

const containerClassName = css`
  padding: 15px 0;
`;

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
      <FabrixComponent
        containerClassName={containerClassName}
        query={createTODOQuery}
      >
        {({ getInput }) =>
          getInput({}, ({ Action, Field }) => (
            <Stack>
              <p>hello</p>
              <HStack>
                <Field name="input.name" />
                <Action />
              </HStack>
            </Stack>
          ))
        }
      </FabrixComponent>
      <FabrixComponent
        containerClassName={containerClassName}
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
