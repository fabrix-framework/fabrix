import {
  FieldComponentProps,
  ComponentRegistry,
  FormComponentProps,
  FormFieldComponentProps,
  TableComponentProps,
} from "@fabrix-framework/fabrix";
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
        label: `${header.label}`,
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
  const getDefaultValue = () => {
    if (props.type?.type === "Scalar" && props.type.name === "Boolean") {
      return false;
    }
    return "";
  };

  const { field, formState } = useController({
    name: props.name,
    defaultValue: getDefaultValue(),
  });
  const error = formState.errors[props.name];

  switch (props.type?.type) {
    case "Enum": {
      return (
        <div role="group" aria-label={props.name}>
          <label htmlFor={props.name}>{props.attributes.label}</label>
          <select
            {...field}
            name={props.name}
            id={props.name}
            onChange={(e) => {
              field.onChange(e.target.value);
            }}
          >
            {props.type.meta.values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {error && <div role="alert">{error?.message?.toString()}</div>}
        </div>
      );
    }

    case "Scalar": {
      if (props.type.name === "Boolean") {
        return (
          <div role="group" aria-label={props.name}>
            <label htmlFor={props.name}>{props.attributes.label}</label>
            <input
              {...field}
              name={props.name}
              id={props.name}
              type="checkbox"
              onChange={(e) => {
                field.onChange(e.target.checked);
              }}
            />
            {error && <div role="alert">{error?.message?.toString()}</div>}
          </div>
        );
      }

      const isNumber =
        props.type?.type === "Scalar" &&
        (props.type.name === "Int" || props.type.name === "Float");

      return (
        <div role="group" aria-label={props.name}>
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
        </div>
      );
    }

    default:
      return null;
  }
};

export const UnstyledRegistry = new ComponentRegistry({
  default: {
    field: fieldView,
    form: formView,
    formField: formFieldView,
    table: tableView,
  },
});
