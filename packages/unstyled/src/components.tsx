import {
  FieldComponentProps,
  ComponentRegistry,
  FormComponentProps,
  FormFieldComponentProps,
  TableComponentProps,
} from "@fabrix-framework/fabrix";
import { ReactNode } from "react";
import { FieldErrors, useController } from "react-hook-form";
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

const FormFieldWrapper = (
  props: React.PropsWithChildren<
    FormFieldComponentProps & {
      error?: FieldErrors[string];
    }
  >,
) => (
  <div role="group" aria-label={props.name}>
    <label htmlFor={props.name}>{props.attributes.label}</label>
    {props.children}
    {props.error && <div role="alert">{props.error.message?.toString()}</div>}
  </div>
);

const formFieldView = (props: FormFieldComponentProps) => {
  const { field, formState } = useController({
    name: props.name,
    defaultValue: () => {
      if (props.type?.type === "Scalar" && props.type.name === "Boolean") {
        return false;
      }
      return "";
    },
  });
  const error = formState.errors[props.name];

  switch (props.type?.type) {
    case "Enum": {
      return (
        <FormFieldWrapper {...props} error={error}>
          <select
            {...field}
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
        </FormFieldWrapper>
      );
    }

    case "Scalar": {
      switch (props.type.name) {
        case "Boolean": {
          return (
            <FormFieldWrapper {...props}>
              <input
                {...field}
                type="checkbox"
                onChange={(e) => {
                  field.onChange(e.target.checked);
                }}
              />
            </FormFieldWrapper>
          );
        }

        case "Int":
        case "Float": {
          return (
            <FormFieldWrapper {...props}>
              <input
                {...field}
                onChange={(e) => {
                  field.onChange(parseFloat(e.target.value));
                }}
              />
            </FormFieldWrapper>
          );
        }

        case "Date": {
          return (
            <FormFieldWrapper {...props}>
              <input {...field} type="date" />
            </FormFieldWrapper>
          );
        }

        case "DateTime": {
          return (
            <FormFieldWrapper {...props}>
              <input {...field} type="datetime-local" />
            </FormFieldWrapper>
          );
        }

        default: {
          return (
            <FormFieldWrapper {...props}>
              <input {...field} />
            </FormFieldWrapper>
          );
        }
      }
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
