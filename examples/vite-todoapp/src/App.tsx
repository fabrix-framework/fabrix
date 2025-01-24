import { Heading, Stack, HStack } from "@chakra-ui/react";
import { FabrixComponent, gql } from "@fabrix-framework/fabrix";
import { css } from "@emotion/css";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const createTodoSchema = z.object({
  input: z.object({
    name: z.string().min(3),
  }),
});

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
          getInput(
            {
              resolver: zodResolver(createTodoSchema),
            },
            ({ Action, Field }) => (
              <Stack>
                <p>hello</p>
                <HStack>
                  <Field name="input.name" />
                  <Field name="input.priority" />
                  <Action />
                </HStack>
              </Stack>
            ),
          )
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
