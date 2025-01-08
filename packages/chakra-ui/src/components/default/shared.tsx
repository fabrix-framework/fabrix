import { Heading, Badge, HStack } from "@chakra-ui/react";
import { Field } from "@components/ui/field";
import {
  FieldComponentProps,
  FormFieldComponentProps,
} from "@fabrix-framework/fabrix";

export const LabelledHeading = (
  props: FormFieldComponentProps | FieldComponentProps,
) => {
  const isRequired = "isRequired" in props ? props.isRequired : false;
  const { attributes } = props;

  return (
    <Field label={props.name}>
      <HStack gap={2}>
        <Heading size="xs">{attributes.label}</Heading>
        {isRequired && (
          <Badge colorScheme="red" fontSize="xs">
            REQUIRED
          </Badge>
        )}
      </HStack>
    </Field>
  );
};
