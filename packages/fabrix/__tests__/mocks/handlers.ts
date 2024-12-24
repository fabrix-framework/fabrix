import { graphql, HttpResponse } from "msw";
import { buildSchema, graphql as executeGraphql } from "graphql";
import { ObjMap } from "graphql/jsutils/ObjMap";
import { users } from "./data";

export const mockSchema = buildSchema(`
# Relay Node
interface Node {
  id: ID!
}

# Relay PageInfo
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type User implements Node {
  id: ID!
  name: String!
  email: String!
}

type UsersResult {
  collection: [User!]!
  size: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type UsersConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type Query {
  users: UsersResult
  userEdges: UsersConnection
}

enum UserCategory {
  ADMIN
  USER
}

input CreateUserInput {
  id: ID
  name: String!
  email: String
  age: Int!
  category: UserCategory
}

type Mutation {
  createUser(input: CreateUserInput!): User
}
`);

const resolvers = {
  users: () => ({
    collection: users,
    size: users.length,
  }),
  userEdges: () => {
    const edges = users.map((user) => ({
      node: user,
      cursor: Buffer.from(user.id).toString("base64"),
    }));
    return {
      edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
    };
  },
};

export const handlers = [
  graphql.operation(async ({ query, variables }) => {
    const { data, errors } = await executeGraphql({
      schema: mockSchema,
      source: query,
      variableValues: variables,
      rootValue: resolvers,
    });

    return HttpResponse.json<ObjMap<unknown>>({
      errors,
      data,
    });
  }),
];
