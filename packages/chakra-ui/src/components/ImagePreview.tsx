import { Stack, Img, Text } from "@chakra-ui/react";
import { FieldComponentProps } from "@fabrix-framework/fabrix";
import { LabelledHeading } from "./default/shared";

export const ImagePreview = (props: FieldComponentProps) => {
  const { className } = props.attributes;

  return (
    <Stack className={className} spacing={2}>
      <LabelledHeading {...props} />
      <Text fontSize="sm">
        {typeof props.value === "string" ? (
          <Img src={String(props.value)} />
        ) : (
          "-"
        )}
      </Text>
    </Stack>
  );
};
