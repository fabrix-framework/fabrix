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
          mutation createTodo(
            $id: ID!
            $input1: TodoInput!
            $input2: TodoInput!
          ) {
            addTodo(input: $input1) {
              id
            }
          }
        `}
      />
      <FabrixComponent
        containerClassName={containerClassName}
        query={gql`
          query todos {
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
      />
    </Stack>
  );
}

export default App;
