/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type MarkTodoDoneInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addTodo?: Maybe<Todo>;
  markTodoDone?: Maybe<Todo>;
};


export type MutationAddTodoArgs = {
  input: TodoInput;
};


export type MutationMarkTodoDoneArgs = {
  input: MarkTodoDoneInput;
};

export type Query = {
  __typename?: 'Query';
  allTodos?: Maybe<TodosCollection>;
};

export type Todo = {
  __typename?: 'Todo';
  hasDone: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  priority: TodoPriority;
};

export type TodoInput = {
  hasDone?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  priority: TodoPriority;
};

export enum TodoPriority {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type TodosCollection = {
  __typename?: 'TodosCollection';
  collection: Array<Maybe<Todo>>;
};

export type AddTodoMutationVariables = Exact<{
  input: TodoInput;
}>;


export type AddTodoMutation = { __typename?: 'Mutation', addTodo?: { __typename?: 'Todo', id: string } | null };

export type AllTodosQueryVariables = Exact<{ [key: string]: never; }>;


export type AllTodosQuery = { __typename?: 'Query', allTodos?: { __typename?: 'TodosCollection', collection: Array<{ __typename?: 'Todo', id: string, name: string, priority: TodoPriority, hasDone: boolean } | null> } | null };

export type MarkTodoDoneMutationVariables = Exact<{
  input: MarkTodoDoneInput;
}>;


export type MarkTodoDoneMutation = { __typename?: 'Mutation', markTodoDone?: { __typename?: 'Todo', id: string } | null };


export const AddTodoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addTodo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TodoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTodo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddTodoMutation, AddTodoMutationVariables>;
export const AllTodosDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"allTodos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allTodos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"hasDone"}}]}}]}}]}}]} as unknown as DocumentNode<AllTodosQuery, AllTodosQueryVariables>;
export const MarkTodoDoneDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"markTodoDone"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkTodoDoneInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markTodoDone"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MarkTodoDoneMutation, MarkTodoDoneMutationVariables>;