import { graphql, HttpResponse } from "msw";
import { buildSchema, graphql as executeGraphql } from "graphql";
import { ObjMap } from "graphql/jsutils/ObjMap";
import { users } from "./data";

const mockSchema = buildSchema(`
type User {
  id: ID!
  name: String!
  email: String!
  imageURL: String
}

type UsersResult {
  collection: [User!]!
}

type Query {
  users: UsersResult
  user: User
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
  }),
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
