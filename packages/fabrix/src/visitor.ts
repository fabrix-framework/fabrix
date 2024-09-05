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

export class Path {
  constructor(readonly value: string[] = []) {}

  asKey(delimiter = ".") {
    return this.value.join(delimiter);
  }

  getName() {
    return this.value[this.value.length - 1];
  }

  getParent() {
    if (this.value.length === 0) {
      return;
    }

    return new Path(this.value.slice(0, this.value.length - 1));
  }

  getLevel() {
    return this.value.length;
  }

  append(path: Path | string) {
    return new Path([
      ...this.value,
      ...(path instanceof Path ? path.value : [path]),
    ]);
  }

  /**
   * Get the path instance with the root offset by the given start index.
   */
  rootOffset(start: number) {
    const sliced = this.value.slice(start);
    if (sliced.length === 0) {
      return null;
    }

    return new Path(sliced);
  }
}

type SubField = {
  name: string;
  path: Path;
};

type FieldConstructorProps = {
  fields: Array<SubField>;
  path: Path;
  directives: ReadonlyArray<DirectiveNode>;
};

export class Field {
  constructor(readonly value: FieldConstructorProps) {}

  getName() {
    return this.value.path.getName();
  }

  getParentName() {
    return this.value.path.getParent()?.getName();
  }

  getLevel() {
    return this.value.path.getLevel();
  }
}

type AddFieldProps = {
  name: string;
  fields: Array<string>;
  directives: ReadonlyArray<DirectiveNode>;
};

export class Fields {
  constructor(private value: Array<Field> = []) {}

  add(props: AddFieldProps) {
    const path = this.buildPath(props.name);
    this.value.push(
      new Field({
        path,
        fields: props.fields.map((f) => ({
          name: f,
          path: path.append(f),
        })),
        directives: props.directives,
      }),
    );
  }

  getChildren(parentName: string) {
    return new Fields(
      this.value.filter((f) => f.getParentName() === parentName),
    );
  }

  getChildrenWithAncestors(parentName: string) {
    const getChildrenRecursively = (parentName: string): Array<Field> => {
      const children = this.getChildren(parentName);
      return children.unwrap().length > 0
        ? children
            .unwrap()
            .flatMap((f) => [f, ...getChildrenRecursively(f.getName())])
        : [];
    };

    return new Fields(getChildrenRecursively(parentName));
  }

  getParent(childName: string) {
    return this.value.find((f) =>
      f.value.fields.map((f) => f.name).includes(childName),
    );
  }

  getByPathKey(key: string) {
    return this.value.find((f) => f.value.path.asKey() === key);
  }

  unwrap() {
    return this.value;
  }

  /**
   * Recursively build the path key for a field
   */
  private buildPath(name: string, acc: string[] = []): Path {
    const parent = this.getParent(name);
    if (parent) {
      return this.buildPath(parent.getName(), [name, ...acc]);
    }

    return new Path([name, ...acc]);
  }
}

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

  const extractSelections = (node: FieldNode) =>
    node.selectionSet?.selections.flatMap((selection) =>
      selection.kind === Kind.INLINE_FRAGMENT ? [] : [selection.name.value],
    ) ?? [];

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
  });

  return operationStructure;
};

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
