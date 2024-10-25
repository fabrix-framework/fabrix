import {
  FormFieldComponentProps,
  FormComponentProps,
  FieldType,
} from "@fabrix-framework/fabrix";
import { Text, Switch, Input, Stack, Button, Box } from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { useController } from "@fabrix-framework/fabrix/rhf";
import { LabelledHeading } from "./shared";

export const ChakraForm = (props: FormComponentProps) => {
  return (
    <Box className={props.className} rowGap={"20px"}>
      {props.renderFields()}
      {props.renderSubmit(({ submit, isSubmitting }) => (
        <Button
          className="col-12"
          colorScheme="blue"
          marginTop={2}
          isDisabled={isSubmitting}
          onClick={() => submit()}
        >
          Submit
        </Button>
      ))}
    </Box>
  );
};

export const ChakraFormField = (props: FormFieldComponentProps) => {
  switch (props.type?.type) {
    case "Scalar": {
      switch (props.type.name) {
        case "Number":
          return <NumberFormField {...props} />;
        case "Boolean":
          return <BooleanFormField {...props} />;
        default:
          return <TextFormField {...props} />;
      }
    }
    case "Enum":
      return <SelectFormField {...props} type={props.type} />;
    case "List": {
      const innerType = props.type.innerType;
      switch (innerType.type) {
        case "Enum":
          return <MultiSelectFormField {...props} type={innerType} />;
        default:
          return <TextFormField {...props} />;
      }
    }
    default:
      return <TextFormField {...props} />;
  }
};

const ErrorField = (props: FormFieldComponentProps) => {
  const { formState } = useController({
    name: props.name,
  });
  const error = formState.errors[props.name];

  return (
    error && (
      <Text color="red.500" size="sm" role="alert">
        {error?.message?.toString()}
      </Text>
    )
  );
};

type EnumFieldType = Extract<FieldType, { type: "Enum" }>;

const MultiSelectFormField = (
  props: FormFieldComponentProps & { type: EnumFieldType },
) => {
  const { className } = props.attributes;
  const { field } = useController({
    name: props.name,
  });
  const values = props.type.meta.values.map((value) => ({
    value,
    label: value,
  }));

  return (
    <Stack className={className} spacing={2}>
      <LabelledHeading {...props} />
      <Select
        isMulti
        options={values}
        name={field.name}
        ref={field.ref}
        onBlur={field.onBlur}
        onChange={(e) => field.onChange(e.map(({ value }) => value))}
      />
    </Stack>
  );
};

const SelectFormField = (
  props: FormFieldComponentProps & { type: EnumFieldType },
) => {
  const { className } = props.attributes;
  const { field } = useController({
    name: props.name,
  });
  const values = props.type.meta.values.map((value) => ({
    value,
    label: value,
  }));

  return (
    <Stack className={className} spacing={2}>
      <LabelledHeading {...props} />
      <Select
        options={values}
        name={field.name}
        ref={field.ref}
        onBlur={field.onBlur}
        onChange={(e) => e && field.onChange(e.value)}
      />
      <ErrorField {...props} />
    </Stack>
  );
};

const TextFormField = (props: FormFieldComponentProps) => {
  const { attributes } = props;
  const { field } = useController({
    name: props.name,
    defaultValue: props.value ?? "",
  });

  return (
    <Stack className={attributes.className} spacing={2}>
      <LabelledHeading {...props} />
      <Input {...field} placeholder="Enter value" />
      <ErrorField {...props} />
    </Stack>
  );
};

const NumberFormField = (props: FormFieldComponentProps) => {
  const { className } = props.attributes;
  const { field } = useController({
    name: props.name,
    defaultValue: props.value ?? "",
  });

  return (
    <Stack className={className} spacing={2}>
      <LabelledHeading {...props} />
      <Input
        {...field}
        type="number"
        placeholder="Enter value"
        onChange={(e) => {
          field.onChange(parseFloat(e.target.value));
        }}
      />
      <ErrorField {...props} />
    </Stack>
  );
};

const BooleanFormField = (props: FormFieldComponentProps) => {
  const { className } = props.attributes;
  const { field } = useController({
    name: props.name,
  });

  return (
    <Stack className={className} spacing={2}>
      <LabelledHeading {...props} />
      <Switch {...field} size="lg" />
      <ErrorField {...props} />
    </Stack>
  );
};
