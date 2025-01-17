import { Fields, SelectionField } from "@visitor/fields";
import {
  DirectiveNode,
  DocumentNode,
  FieldNode,
  Kind,
  OperationTypeNode,
  parse,
  TypeNode,
  ValueNode,
  visit,
} from "graphql";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";

export type FieldVariables = Record<
  string,
  {
    type: string;
  }
>;

type S = {
  document: DocumentNode;
  name: string;
  opType: OperationTypeNode;
  variables: FieldVariables;
  fields: Fields;
};

export type GeneralDocumentType<
  TData = unknown,
  TVariables = Record<string, unknown>,
> = DocumentNode | TypedDocumentNode<TData, TVariables>;

export const buildRootDocument = <
  TData = unknown,
  TVariables = Record<string, unknown>,
>(
  document: GeneralDocumentType<TData, TVariables>,
) =>
  document.definitions.map((def) =>
    buildQueryStructure({
      kind: Kind.DOCUMENT,
      definitions: [def],
    }),
  );

const buildQueryStructure = (ast: DocumentNode | string) => {
  const operationStructure = {} as S;

  const extractTypeNode = (node: TypeNode) => {
    switch (node.kind) {
      case Kind.NON_NULL_TYPE:
        return extractTypeNode(node.type);
      case Kind.LIST_TYPE:
        return extractTypeNode(node.type);
      case Kind.NAMED_TYPE:
        return node.name.value;
      default:
        return null;
    }
  };

  const currentPath: string[] = [];
  visit(typeof ast === "string" ? parse(ast) : ast, {
    OperationDefinition: (node) => {
      // No fragment support currently
      if (
        node.operation !== OperationTypeNode.QUERY &&
        node.operation !== OperationTypeNode.MUTATION
      ) {
        return;
      }

      operationStructure.document = {
        kind: Kind.DOCUMENT,
        definitions: [node],
      } as const;
      operationStructure.name = node.name ? node.name.value : "unnamed";
      operationStructure.opType = node.operation;
      operationStructure.variables = {};
      operationStructure.fields = new Fields();
    },
    VariableDefinition: (node) => {
      const nodeType = extractTypeNode(node.type);
      if (!nodeType) {
        return;
      }

      operationStructure.variables[node.variable.name.value] = {
        type: nodeType,
      };
    },
    Field: {
      enter: (node) => {
        const fields = extractSelections(node);
        const name = node.alias?.value ?? node.name.value;

        currentPath.push(name);
        operationStructure.fields.add({
          name,
          fields,
          directives: node.directives ?? [],
          path: [...currentPath],
        });
      },
      leave: () => currentPath.pop(),
    },
    FragmentSpread: (node) => {
      operationStructure.fields.add({
        name: node.name.value,
        fields: [],
        directives: node.directives ?? [],
        path: [...currentPath, node.name.value],
      });
    },
  });

  return operationStructure;
};

const extractSelections = (node: FieldNode) =>
  node.selectionSet?.selections.flatMap<SelectionField>((selection) => {
    switch (selection.kind) {
      case Kind.FIELD:
        return [
          {
            type: "field",
            name: selection.name.value,
          },
        ];
      case Kind.FRAGMENT_SPREAD:
        return [
          {
            type: "fragment",
            name: selection.name.value,
          },
        ];
      default:
        return [];
    }
  }) ?? [];

export type DirectiveConfig = {
  name: string;
  arguments: Record<string, unknown>;
};

/**
 * A helper function to extract arguments from Fabrix directives.
 */
export const buildDirectiveConfig = (directive: DirectiveNode) => {
  const directiveConfig = {} as DirectiveConfig;

  const getValue = (valueNode: ValueNode): unknown => {
    switch (valueNode.kind) {
      case Kind.VARIABLE:
      case Kind.NULL:
        // No support for variables or null values
        return;
      case Kind.LIST:
        return valueNode.values.map(getValue);
      case Kind.OBJECT:
        return valueNode.fields.reduce((acc, f) => {
          return {
            ...acc,
            [f.name.value]: getValue(f.value),
          };
        }, {});
      case Kind.INT:
        return parseInt(valueNode.value, 10);
      case Kind.FLOAT:
        return parseFloat(valueNode.value);
      case Kind.STRING:
      case Kind.BOOLEAN:
        return valueNode.value;
    }
  };

  visit(directive, {
    Directive: (node) => {
      directiveConfig.name = node.name.value;
    },

    Argument: (node) => {
      directiveConfig.arguments = {
        ...directiveConfig.arguments,
        [node.name.value]: getValue(node.value),
      };
    },
  });

  return directiveConfig;
};
