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

export const buildRootDocument = (document: DocumentNode) =>
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
    Field: (node) => {
      const fields = extractSelections(node);
      const name = node.alias?.value ?? node.name.value;

      operationStructure.fields.add({
        name,
        fields,
        directives: node.directives ?? [],
      });
    },
    FragmentSpread: (node) => {
      operationStructure.fields.add({
        name: node.name.value,
        fields: [],
        directives: node.directives ?? [],
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
