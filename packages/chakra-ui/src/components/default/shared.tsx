import { Flex, Heading, Badge } from "@chakra-ui/react";
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
    <Flex gap={2}>
      <Heading size="xs">{attributes.label}</Heading>
      {isRequired && (
        <Badge colorScheme="red" fontSize="xs">
          REQUIRED
        </Badge>
      )}
    </Flex>
  );
};
