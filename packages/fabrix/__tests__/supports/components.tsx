import {
  FieldComponentProps,
  ComponentRegistry,
  FormComponentProps,
  FormFieldComponentProps,
  TableComponentProps,
} from "@registry";
import { ReactNode } from "react";
import { useController } from "react-hook-form";
import { get } from "es-toolkit/compat";

const fieldView = (props: FieldComponentProps) => {
  const { value, type, name } = props;

  if (type?.type === "Object" || type?.type === "List") {
    return null;
  }

  return (
    <div role="region">
      <label>{name}:</label>
      <span>{value as ReactNode}</span>
    </div>
  );
};

const tableView = (props: TableComponentProps) => {
  const headers = props.headers.flatMap((header) => {
    if (header.type?.type === "Object" || header.type?.type === "List") {
      return [];
    }

    return [
      {
        key: header.key,
        label: `${header.label} (${header.type?.type}:${header.type?.name})`,
      },
    ];
  });

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header.key}>{header.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.values.map((item, index) => (
          <tr key={index}>
            {headers.map((header) => (
              <td key={header.key}>{get(item, header.key) as ReactNode}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const formView = (props: FormComponentProps) => {
  const action = props.getAction();

  return (
    <div role="form">
      {props.renderFields()}
      <button onClick={action.onClick}>Submit</button>
    </div>
  );
};

const formFieldView = (props: FormFieldComponentProps) => {
  const { field, formState } = useController({
    name: props.name,
    defaultValue: "",
    rules: {
      required: props.isRequired,
    },
  });
  const error = get(formState.errors, props.name);
  const isNumber =
    props.type?.type === "Scalar" &&
    (props.type.name === "Int" || props.type.name === "Float");

  return (
    <fieldset aria-label={`field:${props.name}`}>
      <label htmlFor={props.name}>{props.attributes.label}</label>
      <input
        {...field}
        id={props.name}
        onChange={(e) => {
          if (e.target.value && isNumber) {
            field.onChange(parseFloat(e.target.value));
          } else {
            field.onChange(e.target.value);
          }
        }}
      />
      {error && <div role="alert">{error?.message?.toString()}</div>}
    </fieldset>
  );
};

export const testingComponents = new ComponentRegistry({
  default: {
    field: fieldView,
    form: formView,
    formField: formFieldView,
    table: tableView,
  },
});
