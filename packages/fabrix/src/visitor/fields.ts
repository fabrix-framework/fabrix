import { Path } from "@visitor/path";
import { DirectiveNode } from "graphql";

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

export type SelectionField = {
  type: "field" | "fragment";
  name: string;
};

type AddFieldProps = {
  name: string;
  fields: Array<SelectionField>;
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
          name: f.name,
          path: path.append(f.name),
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
