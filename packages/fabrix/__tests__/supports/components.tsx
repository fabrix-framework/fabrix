import {
  FieldComponentProps,
  ComponentRegistry,
  FormComponentProps,
  FormFieldComponentProps,
  TableComponentProps,
} from "@registry";
import { ReactNode } from "react";
import { useController } from "react-hook-form";

const fieldView = (props: FieldComponentProps) => {
  const { value } = props;

  return <span>{value as string}</span>;
};

const tableView = (props: TableComponentProps) => {
  return (
    <table>
      <thead>
        <tr>
          {props.headers.map((header) => (
            <th key={header.key}>{header.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.values.map((item, index) => (
          <tr key={index}>
            {props.headers.map((header) => (
              <td key={header.key}>{item[header.key] as ReactNode}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const formView = (props: FormComponentProps) => {
  return (
    <div role="form">
      {props.renderFields()}
      {props.renderSubmit(({ submit }) => (
        <button onClick={() => submit()}>Submit</button>
      ))}
    </div>
  );
};

const formFieldView = (props: FormFieldComponentProps) => {
  const { field, formState } = useController({
    name: props.name,
    defaultValue: "",
  });
  const error = formState.errors[props.name];
  const isNumber =
    props.type?.type === "Scalar" &&
    (props.type.name === "Int" || props.type.name === "Float");

  return (
    <fieldset aria-label={`field:${props.name}`}>
      <label htmlFor={props.name}>{props.attributes.label}</label>
      <input
        {...field}
        name={props.name}
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
