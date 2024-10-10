import {
  FieldComponentProps,
  ComponentRegistry,
  FormComponentProps,
  FormFieldComponentProps,
  TableComponentProps,
} from "@registry";
import { ReactNode } from "react";

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
  return (
    <div>
      <label htmlFor={props.name} aria-label={props.name}>
        {props.attributes.label}
      </label>
      <input name={props.name} />
    </div>
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
