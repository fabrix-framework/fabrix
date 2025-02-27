/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n          mutation createTodo($input: TodoInput!) {\n            addTodo(input: $input) {\n              id\n            }\n          }\n        ": types.CreateTodoDocument,
    "\n          query todos {\n            allTodos\n              @fabrixView(\n                input: [\n                  { field: \"collection\", config: { label: \"Your tasks\" } }\n                  { field: \"collection.id\", config: { hidden: true } }\n                  { field: \"collection.hasDone\", config: { label: \"Status\" } }\n                  {\n                    field: \"collection.actions\"\n                    config: {\n                      label: \"Actions\"\n                      index: -1\n                      componentType: {\n                        name: \"IDActionCell\"\n                        props: [\n                          { name: \"label\", value: \"Done\" }\n                          { name: \"color\", value: \"blue\" }\n                          { name: \"mutation\", value: \"markTodoDone\" }\n                        ]\n                      }\n                    }\n                  }\n                ]\n              ) {\n              collection {\n                id\n                name\n                priority\n                hasDone\n              }\n            }\n          }\n        ": types.TodosDocument,
    "\n          mutation markTodoDone($input: MarkTodoDoneInput!) {\n            markTodoDone(input: $input) {\n              id\n            }\n          }\n        ": types.MarkTodoDoneDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n          mutation createTodo($input: TodoInput!) {\n            addTodo(input: $input) {\n              id\n            }\n          }\n        "): (typeof documents)["\n          mutation createTodo($input: TodoInput!) {\n            addTodo(input: $input) {\n              id\n            }\n          }\n        "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n          query todos {\n            allTodos\n              @fabrixView(\n                input: [\n                  { field: \"collection\", config: { label: \"Your tasks\" } }\n                  { field: \"collection.id\", config: { hidden: true } }\n                  { field: \"collection.hasDone\", config: { label: \"Status\" } }\n                  {\n                    field: \"collection.actions\"\n                    config: {\n                      label: \"Actions\"\n                      index: -1\n                      componentType: {\n                        name: \"IDActionCell\"\n                        props: [\n                          { name: \"label\", value: \"Done\" }\n                          { name: \"color\", value: \"blue\" }\n                          { name: \"mutation\", value: \"markTodoDone\" }\n                        ]\n                      }\n                    }\n                  }\n                ]\n              ) {\n              collection {\n                id\n                name\n                priority\n                hasDone\n              }\n            }\n          }\n        "): (typeof documents)["\n          query todos {\n            allTodos\n              @fabrixView(\n                input: [\n                  { field: \"collection\", config: { label: \"Your tasks\" } }\n                  { field: \"collection.id\", config: { hidden: true } }\n                  { field: \"collection.hasDone\", config: { label: \"Status\" } }\n                  {\n                    field: \"collection.actions\"\n                    config: {\n                      label: \"Actions\"\n                      index: -1\n                      componentType: {\n                        name: \"IDActionCell\"\n                        props: [\n                          { name: \"label\", value: \"Done\" }\n                          { name: \"color\", value: \"blue\" }\n                          { name: \"mutation\", value: \"markTodoDone\" }\n                        ]\n                      }\n                    }\n                  }\n                ]\n              ) {\n              collection {\n                id\n                name\n                priority\n                hasDone\n              }\n            }\n          }\n        "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n          mutation markTodoDone($input: MarkTodoDoneInput!) {\n            markTodoDone(input: $input) {\n              id\n            }\n          }\n        "): (typeof documents)["\n          mutation markTodoDone($input: MarkTodoDoneInput!) {\n            markTodoDone(input: $input) {\n              id\n            }\n          }\n        "];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;