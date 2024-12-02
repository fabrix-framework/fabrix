import { DirectiveNode, DocumentNode, OperationTypeNode, parse } from "graphql";
import { useCallback, useContext, useMemo } from "react";
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import {
  FieldTypes,
  FabrixComponentFieldsRenderer,
  CommonFabrixComponentRendererProps,
} from "@renderers/shared";
import { directiveSchemaMap } from "@directive/schema";
import { mergeFieldConfigs } from "@readers/shared";
import { buildDefaultViewFieldConfigs, viewFieldMerger } from "@readers/field";
import { buildDefaultFormFieldConfigs, formFieldMerger } from "@readers/form";
import { buildRootDocument, FieldVariables } from "@/visitor";
import { Field, Fields } from "@/visitor/fields";
import { FabrixComponentData } from "@/fetcher";

const decideStrategy = (
  directiveNodes: readonly DirectiveNode[],
  opType: OperationTypeNode,
) => {
  const directive = findDirective(directiveNodes);
  const emptyDirective = {
    arguments: null,
  } as const;

  switch (opType) {
    case OperationTypeNode.QUERY: {
      return {
        type: "view",
        directive:
          directive?.name === "fabrixView" ? directive : emptyDirective,
      } as const;
    }
    case OperationTypeNode.MUTATION: {
      return {
        type: "form",
        directive:
          directive?.name === "fabrixForm" ? directive : emptyDirective,
      } as const;
    }
    default: {
      return null;
    }
  }
};

/**
 * A helper function to extract the field configuration from the directive
 *
 * If there is no directive, it will infer the field configuration from the fields
 */
const getFieldConfig = (
  context: FabrixContextType,
  field: Field,
  fieldVariables: FieldVariables,
  childFields: Fields,
  opType: OperationTypeNode,
) => {
  const strategy = decideStrategy(field.value.directives, opType);
  switch (strategy?.type) {
    case "view": {
      const directive = parseDirectiveArguments(
        strategy.directive.arguments,
        directiveSchemaMap.fabrixView.schema,
      );

      return {
        name: field.getName(),
        type: strategy.type,
        configs: {
          fields: mergeFieldConfigs(
            buildDefaultViewFieldConfigs(childFields),
            directive.input,
            viewFieldMerger,
          ),
        },
      };
    }
    case "form": {
      const directive = parseDirectiveArguments(
        strategy.directive.arguments,
        directiveSchemaMap.fabrixForm.schema,
      );

      return {
        name: field.getName(),
        type: strategy.type,
        configs: {
          fields: mergeFieldConfigs(
            buildDefaultFormFieldConfigs(context, fieldVariables),
            directive.input,
            formFieldMerger,
          ),
        },
      };
    }
    default: {
      return null;
    }
  }
};

export type FieldConfig = ReturnType<typeof getFieldConfig> & {
  document: DocumentNode;
};
type FieldConfigs = Record<string, FieldConfig>;

export const useFieldConfigs = (query: DocumentNode | string) => {
  const rootDocument = buildRootDocument(
    typeof query === "string" ? parse(query) : query,
  );
  const context = useContext(FabrixContext);
  const fieldConfigs = useMemo(() => {
    return rootDocument.map(({ document, fields, opType, variables }) =>
      fields
        .unwrap()
        .filter((f) => !f.getParentName())
        .reduce<FieldConfigs>((acc, field) => {
          const fieldConfig = getFieldConfig(
            context,
            field,
            variables,
            fields.getChildrenWithAncestors(field.getName()),
            opType,
          );
          if (!fieldConfig) {
            return acc;
          }

          return {
            ...acc,
            [field.getName()]: {
              document,
              ...fieldConfig,
            },
          };
        }, {}),
    );
  }, [rootDocument, context]);

  return {
    fieldConfigs,
  };
};

type FabrixComponentCommonProps = {
  /**
   * The variables to call the query with.
   */
  variables?: Record<string, unknown>;

  /**
   * The data to render the query with.
   *
   * If this parameter is given, the query will not be executed.
   *
   * The data structure is expected to be like this:
   * ```
   * {
   *   getContract: {
   *     id: "1",
   *     name: "Contract name",
   *     code: "C1",
   *   }
   * }
   * ```
   *
   * The root key is the query name, and the value is the object with the field values.
   */
  data?: FabrixComponentData;

  /**
   * The title of the query.
   */
  title?: string;

  /**
   * The class name of the container component
   */
  containerClassName?: string;

  /**
   * The class name of the content component
   */
  contentClassName?: string;
};

export type FabrixComponentProps = FabrixComponentCommonProps & {
  /**
   * The query to render.
   *
   * ```graphql
   * query ($id: string) {
   *   getContract(id: $id) {
   *     id
   *     name
   *     code
   *   }
   * }
   * ```
   */
  query: DocumentNode | string;
};

type FabrixComponentChildrenExtraProps = { key?: string; className?: string };
type FabrixComponentChildrenProps = {
  /**
   * Get the component by query name
   *
   * ```tsx
   * <FabrixComponent query={appQuery}>
   *   {({ getComponent }) => (
   *     <>
   *       {getComponent("createEmployee")}
   *       {getComponent("getEmployees")}
   *     </>
   *   )}
   * </FabrixComponent>
   * ```
   */
  getComponent: (
    /**
     * The name that corresponds to the GQL query.
     */
    name: string,
    extraProps?: FabrixComponentChildrenExtraProps,
    fieldsRenderer?: FabrixComponentFieldsRenderer,
  ) => React.ReactNode;
};

/**
 * The component to render the corresponding query
 *
 * The simplest pattern is to render the query with the default renderer:
 *
 * ```tsx
 * <FabrixComponent query={appQuery} />
 * ```
 *
 * To render the query with custom renderer, you can use the `getComponent` function provided from children:
 *
 * ```tsx
 * <FabrixComponent query={appQuery}>
 *   {({ getComponent }) => (
 *     <>
 *       {getComponent("createEmployee")}
 *       {getComponent("getEmployees")}
 *     </>
 *   )}
 * </FabrixComponent>
 * ```
 */
export const FabrixComponent = (
  props: FabrixComponentProps & {
    children?: (props: FabrixComponentChildrenProps) => React.ReactNode;
  },
) => {
  const { fieldConfigs } = useFieldConfigs(props.query);
  const renderByField = useCallback(
    (
      field: FieldConfig,
      componentFieldsRenderer?: FabrixComponentFieldsRenderer,
    ) => {
      const context = useContext(FabrixContext);
      const commonProps = {
        query: {
          documentResolver: () => field.document,
          variables: props.variables,
          rootName: field.name,
        },
        defaultData: props.data,
        className: props.contentClassName,
        componentFieldsRenderer,
        context,
      };

      switch (field.type) {
        case "view":
          return <ViewRenderer {...commonProps} fieldConfigs={field.configs} />;
        case "form":
          return <FormRenderer {...commonProps} fieldConfigs={field.configs} />;
        default:
          return null;
      }
    },
    [props.contentClassName, props.data, props.variables],
  );

  const getComponent: FabrixComponentChildrenProps["getComponent"] =
    useCallback(
      (
        name: string,
        extraProps?: FabrixComponentChildrenExtraProps,
        componentFieldsRenderer?: FabrixComponentFieldsRenderer,
      ) => {
        const fieldConfig = fieldConfigs.find((c) => c[name]);
        if (!fieldConfig) {
          return null;
        }

        return (
          <div
            key={extraProps?.key}
            className={`fabrix renderer container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
          >
            {renderByField(fieldConfig[name], componentFieldsRenderer)}
          </div>
        );
      },
      [fieldConfigs, renderByField, props.containerClassName],
    );

  const renderContents = () => {
    if (props.children) {
      return props.children({
        getComponent,
      });
    }

    return fieldConfigs.map((c) =>
      Object.keys(c).map((queryKey, index) =>
        getComponent(queryKey, { key: `renderer-${index}` }),
      ),
    );
  };

  return <div className="fabrix wrapper">{renderContents()}</div>;
};

export type RendererCommonProps = {
  fieldTypes: FieldTypes;
  context: FabrixContextType;
  renderingData: FabrixComponentData | undefined;
  query: CommonFabrixComponentRendererProps["query"];
  extraClassName?: string;
};
