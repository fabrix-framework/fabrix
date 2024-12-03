import { FabrixContext, FabrixContextType } from "@context";
import { FabrixComponentData } from "@fetcher";
import { TableComponentEntry } from "@registry2";
import { FabrixComponentProps } from "@renderer";
import { ComponentRendererProps, FetcherResult } from "@renderer2";
import { getSubFields, SubFields } from "@renderers/fields";
import { FieldConfigByType } from "@renderers/shared";
import { createElement, useContext } from "react";

export const TableRenderer = (
  props: FabrixComponentProps & {
    fieldConfig: FieldConfigByType<"view">;
    component: ComponentRendererProps<TableComponentEntry>;
    fetcherResult: FetcherResult;
  },
) => {
  const context = useContext(FabrixContext);
  const field = props.fieldConfig;
  if (field.type !== "view") {
    throw new Error("Table requires only view fields");
  }

  const { rootValue, collectionValue } = ensureCollectionValue(
    props.fetcherResult.data,
    props.fieldConfig.name,
  );

  const subFields = getSubFields(
    context,
    rootValue,
    field.configs.fields,
    "collection",
  );

  return createElement(props.component.entry.component, {
    headers: buildHeaders(context, subFields),
    values: collectionValue,
    customProps: props.component.customProps,
  });
};

const ensureCollectionValue = (
  value: FabrixComponentData | undefined,
  rootName: string,
) => {
  const rootValue = value?.[rootName];

  if (!rootValue || !("collection" in rootValue)) {
    throw new Error("Table requires a collection value");
  }

  const collectionValue = rootValue.collection;
  if (!Array.isArray(collectionValue)) {
    throw new Error("Table requires a collection value to be an array");
  }

  return {
    collectionValue,
    rootValue,
  };
};

const buildHeaders = (context: FabrixContextType, subFields: SubFields) =>
  subFields.flatMap((subField) => {
    if (subField.value.config.hidden) {
      return [];
    }

    // TODO: fallback to default table cell component
    const component = subField.value.config.componentType?.name
      ? context.componentRegistry.getCustom(
          subField.value.config.componentType.name,
          "tableCell",
        )
      : null;

    const userProps = subField.value.config.componentType?.props?.reduce(
      (acc, prop) => {
        return {
          ...acc,
          [prop.name]: prop.value,
        };
      },
      {},
    );

    const key = subField.value.field.getName();
    const cellRenderer = component
      ? (rowValue: Record<string, unknown>) => {
          return createElement(component, {
            key,
            name: key,
            type: null,
            value: rowValue,
            attributes: {
              className: "",
              label: subField.label,
            },
            userProps,
          });
        }
      : null;

    return {
      label: subField.label,
      key: subField.value.field.getName(),
      type: subField.type,
      render: cellRenderer,
    };
  });
