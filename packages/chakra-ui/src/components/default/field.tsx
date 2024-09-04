import {
  FieldComponentProps,
  FieldType,
  TableComponentHeader,
} from "@fabrix-framework/fabrix";
import { Text, Stack, Badge } from "@chakra-ui/react";
import createColor from "create-color";
import chroma from "chroma-js";
import { useMemo } from "react";
import { ChakraReactTable } from "./table";
import { LabelledHeading } from "./shared";

export const ChakraField = (props: FieldComponentProps) => {
  const { className } = props.attributes;
  const renderValue = () => {
    const { type, value } = props;
    switch (type?.type) {
      case "List":
        return <ListTableField {...props} />;
      default:
        return <SingleValueField type={type} value={value} />;
    }
  };

  return (
    <Stack className={className} spacing={2} marginTop={2}>
      <LabelledHeading {...props} />
      {renderValue()}
    </Stack>
  );
};

export const SingleValueField = (props: {
  type: FieldType | undefined;
  value: unknown;
}) => {
  const { type, value } = props;
  switch (type?.type) {
    case "Enum":
      return <EnumBadgeField {...props} />;
    default:
      return <Text fontSize="md">{String(value)}</Text>;
  }
};

export const EnumBadgeField = (props: { value: unknown }) => {
  const stringValue = String(props.value);
  const backgroundColor = createColor(stringValue);
  const textColor = useMemo(() => {
    const bgColor = chroma(backgroundColor);
    const whiteContrast = chroma.contrast(bgColor, "#FFFFFF");
    const blackContrast = chroma.contrast(bgColor, "#000000");
    return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
  }, []);

  return (
    <Badge
      borderRadius={3}
      alignSelf="flex-start"
      backgroundColor={backgroundColor}
      color={textColor}
    >
      {stringValue}
    </Badge>
  );
};

export const ListTableField = (props: FieldComponentProps) => {
  if (!props.subFields || !Array.isArray(props.value)) {
    return;
  }

  return (
    <ChakraReactTable
      values={props.value}
      headers={props.subFields?.map<TableComponentHeader>((subField) => ({
        key: subField.name,
        label: subField.name,
        type: subField.type,
      }))}
    />
  );
};