import { DirectiveNode } from "graphql";
import { Path } from "./path";

type SubField = {
  type: "field" | "fragment";
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

export type SelectionField = Omit<SubField, "path">;

type AddFieldProps = {
  name: string;
  fields: Array<SelectionField>;
  directives: ReadonlyArray<DirectiveNode>;
  path: string[];
};

export class Fields {
  constructor(private value: Array<Field> = []) {}

  add(props: AddFieldProps) {
    const path = new Path(props.path);
    this.value.push(
      new Field({
        path,
        fields: props.fields.map((f) => ({
          type: f.type,
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

  getByPathKey(key: string) {
    return this.value.find((f) => f.value.path.asKey() === key);
  }

  unwrap() {
    return this.value;
  }
}
