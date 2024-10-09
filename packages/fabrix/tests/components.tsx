import {
  FieldComponentProps,
  ComponentRegistry,
  FormComponentProps,
  FormFieldComponentProps,
} from "@registry";

const fieldView = (props: FieldComponentProps) => {
  const { type, value } = props;
  const renderList = () => {
    if (props.subFields.length === 0 || !Array.isArray(props.value)) {
      return <div />;
    }

    return (
      <table>
        <thead>
          <tr>
            {props.subFields.map((subField) => (
              <th key={subField.name}>{subField.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.value.map((item) => (
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,
                @typescript-eslint/no-unsafe-member-access
            */
            <tr key={item.id}>
              {props.subFields.map((subField) => (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                <td key={subField.name}>{item[subField.name]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  switch (type?.type) {
    case "List":
      return renderList();
    default:
      return <span>{value as string}</span>;
  }
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
      <label htmlFor={props.name}>{props.name}</label>
      <input name={props.name} />
    </div>
  );
};

export const testingComponents = new ComponentRegistry({
  default: {
    field: fieldView,
    form: formView,
    formField: formFieldView,
  },
});
