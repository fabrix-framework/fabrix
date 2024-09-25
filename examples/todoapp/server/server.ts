import { ApolloServer } from "@apollo/server";
import { gql } from "graphql-tag";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { startStandaloneServer } from "@apollo/server/standalone";
import { faker } from "@faker-js/faker";

type Todo = {
  id: string;
  name: string;
  priority: number;
  hasDone: boolean;
};

// In-memory store for todos
const todos: Todo[] = [
  { id: faker.string.uuid(), name: "Task 1", priority: 1, hasDone: true },
  { id: faker.string.uuid(), name: "Task 2", priority: 2, hasDone: false },
  { id: faker.string.uuid(), name: "Task 3", priority: 3, hasDone: false },
];

// Define the GraphQL schema
const typeDefs = gql`
  type Todo {
    id: ID!
    name: String!
    priority: Int!
    hasDone: Boolean!
  }

  type TodosCollection {
    collection: [Todo]!
  }

  input TodoInput {
    name: String!
    priority: Int!
    hasDone: Boolean
  }

  type Query {
    allTodos: TodosCollection
  }

  type Mutation {
    addTodo(input: TodoInput!): Todo
  }
`;

// Define the resolvers
const resolvers = {
  Query: {
    allTodos: (): { collection: Todo[] } => ({ collection: todos }),
  },
  Mutation: {
    addTodo: (
      _: unknown,
      { input }: { input: Omit<Todo, "id" | "hasDone"> },
    ): Todo => {
      const newTodo: Todo = {
        id: faker.string.uuid(),
        hasDone: false,
        ...input,
      };
      todos.push(newTodo);
      return newTodo;
    },
  },
};

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageDisabled()],
});

startStandaloneServer(server, { listen: { port: 8001 } }).then(() => {
  console.log(`GQL server running...`);
});
