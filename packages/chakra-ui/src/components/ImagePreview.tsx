import { Stack, Image, Text } from "@chakra-ui/react";
import { FieldComponentProps } from "@fabrix-framework/fabrix";
import { LabelledHeading } from "./default/shared";

type ImagePreviewProps = {
  width?: string;
  height?: string;
};

export const ImagePreview = (props: FieldComponentProps<ImagePreviewProps>) => {
  const { className } = props.attributes;
  const userProps = props.userProps;

  return (
    <Stack className={className} gap={2}>
      <LabelledHeading {...props} />
      <Text fontSize="sm">
        {typeof props.value === "string" ? (
          <Image
            src={String(props.value)}
            width={userProps?.width}
            height={userProps?.height}
          />
        ) : (
          "-"
        )}
      </Text>
    </Stack>
  );
};
