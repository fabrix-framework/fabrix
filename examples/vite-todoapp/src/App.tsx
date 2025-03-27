import { FabrixComponent } from "@fabrix-framework/fabrix";
import { css } from "@emotion/css";
import { graphql } from "./graphql";

const containerClassName = css`
  padding: 15px 0;
`;

function App() {
  return (
    <div>
      <div>Fabrix TODO app example</div>
      <FabrixComponent
        containerClassName={containerClassName}
        query={graphql(`
          mutation createTodo($input: TodoInput!) {
            addTodo(input: $input) @fabrixForm {
              id
            }
          }
        `)}
      />
      <FabrixComponent
        containerClassName={containerClassName}
        query={graphql(`
          query todos {
            allTodos @fabrixView {
              collection {
                id
                name
                priority
                dueDate
                hasDone
              }
            }
          }
        `)}
      />
    </div>
  );
}

export default App;
