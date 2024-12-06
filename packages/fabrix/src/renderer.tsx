import { DirectiveNode, DocumentNode, OperationTypeNode, parse } from "graphql";
import { ReactNode, useCallback, useContext, useMemo } from "react";
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import {
  FabrixComponentFieldsRenderer,
  Loader,
  resolveFieldTypesFromTypename,
} from "@renderers/shared";
import { directiveSchemaMap } from "@directive/schema";
import { mergeFieldConfigs } from "@readers/shared";
import { buildDefaultViewFieldConfigs, viewFieldMerger } from "@readers/field";
import { buildDefaultFormFieldConfigs, formFieldMerger } from "@readers/form";
import { buildRootDocument, FieldVariables } from "@/visitor";
import { Field, Fields } from "@/visitor/fields";
import { FabrixComponentData, useDataFetch, Value } from "@/fetcher";

const decideStrategy = (
  directiveNodes: readonly DirectiveNode[],
  opType: OperationTypeNode,
) => {
  const directive = findDirective(directiveNodes);
  const emptyDirective = { arguments: null } as const;

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
  }
  return null;
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
type FieldConfigs = {
  name: string;
  document: DocumentNode;
  type: OperationTypeNode;
  fields: FieldConfig[];
};

const useFieldConfigs = (query: DocumentNode | string) => {
  const rootDocument = buildRootDocument(
    typeof query === "string" ? parse(query) : query,
  );
  const context = useContext(FabrixContext);
  const fieldConfigs = useMemo(() => {
    return rootDocument.map(({ name, document, fields, opType, variables }) =>
      fields
        .unwrap()
        .filter((f) => !f.getParentName())
        .reduce<FieldConfigs>(
          (acc, field) => {
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

            acc.fields.push({
              ...fieldConfig,
              document,
            });
            return acc;
          },
          { name, document, type: opType, fields: [] },
        ),
    );
  }, [rootDocument, context]);

  return { fieldConfigs };
};

type FabrixComponentCommonProps = {
  /**
   * The variables to call the query with.
   */
  variables?: Record<string, unknown>;

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

type FabrixGetComponentFn = (
  /**
   * The name that corresponds to the GQL query.
   */
  name: string,
  extraProps?: FabrixComponentChildrenExtraProps,
  fieldsRenderer?: FabrixComponentFieldsRenderer,
) => ReactNode;
type FabrixGetOperationFn = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  indexOrName: number | string,
  renderer?: (props: {
    data: T;
    getComponent: FabrixGetComponentFn;
  }) => ReactNode,
) => ReactNode;

export type FabrixComponentChildrenProps = {
  /**
   * Get the operation result by operation name or index
   *
   * ```tsx
   * <FabrixComponent query={getUsersQuery}>
   *   {({ getOperation }) => (
   *     {getOperation("getUsers", ({ data, getComponent }) => (
   *       <>
   *         <h2>{data.users.size} users</h2>
   *         {getComponent("users")}
   *       </>
   *     ))}
   *   )}
   * </FabrixComponent>
   * ```
   */
  getOperation: FabrixGetOperationFn;
  /**
   * Get the component by root field name
   *
   * ```tsx
   * <FabrixComponent query={getUsersQuery}>
   *   {({ getComponent }) => (
   *     {getComponent("getUsers", "users")}
   *   )}
   * </FabrixComponent>
   * ```
   */
  getComponent: (
    operationIndexOrName: number | string,
    rootFieldName: string,
    extraProps?: FabrixComponentChildrenExtraProps,
    fieldsRenderer?: FabrixComponentFieldsRenderer,
  ) => ReactNode;
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
    children?: (props: FabrixComponentChildrenProps) => ReactNode;
  },
) => {
  const { fieldConfigs } = useFieldConfigs(props.query);
  const renderByField = useCallback(
    (
      field: FieldConfig,
      data: Value,
      context: FabrixContextType,
      componentFieldsRenderer?: FabrixComponentFieldsRenderer,
    ) => {
      const commonProps = {
        context,
        rootField: {
          name: field.name,
          fields: field.configs.fields,
          data,
          type: resolveFieldTypesFromTypename(context, data),
          document: field.document,
          className: props.contentClassName,
          componentFieldsRenderer,
        },
      };
      switch (field.type) {
        case "view":
          return <ViewRenderer {...commonProps} />;
        case "form": {
          return <FormRenderer {...commonProps} />;
        }
        default:
          return null;
      }
    },
    [props.contentClassName, props.variables],
  );

  const getComponentFn = useCallback(
    (
      fieldConfig: FieldConfigs,
      data: FabrixComponentData,
      context: FabrixContextType,
    ) =>
      (
        name: string,
        extraProps?: FabrixComponentChildrenExtraProps,
        componentFieldsRenderer?: FabrixComponentFieldsRenderer,
      ) => {
        const field = fieldConfig.fields.find((f) => f.name === name);
        if (!field) {
          throw new Error(`No root field found for name:${name}`);
        }
        return (
          <div
            key={extraProps?.key}
            className={`fabrix renderer container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
          >
            {renderByField(field, data[name], context, componentFieldsRenderer)}
          </div>
        );
      },
    [fieldConfigs, renderByField, props.containerClassName],
  );

  const getOperation: FabrixComponentChildrenProps["getOperation"] =
    useCallback(
      (indexOrName, renderer) => {
        const fieldConfig =
          typeof indexOrName === "number"
            ? fieldConfigs[indexOrName]
            : fieldConfigs.find(({ name }) => name == indexOrName);
        if (!fieldConfig) {
          throw new Error(`No operation found for indexOrName:${indexOrName}`);
        }

        return (
          <OperationRenderer
            key={`fabrix-operation${typeof indexOrName === "number" ? `-${indexOrName}` : ""}-${fieldConfig.name}`}
            operation={fieldConfig}
            variables={props.variables}
            getComponentFn={getComponentFn}
            renderer={renderer as Parameters<FabrixGetOperationFn>[1]}
          />
        );
      },
      [fieldConfigs, getComponentFn],
    );

  const renderContents = () => {
    if (props.children) {
      return props.children({
        getOperation,
        getComponent: (
          operationIndexOrName,
          rootFieldName,
          extraProps,
          fieldsRenderer,
        ) =>
          getOperation(operationIndexOrName, ({ getComponent }) =>
            getComponent(rootFieldName, extraProps, fieldsRenderer),
          ),
      });
    }

    return fieldConfigs.map((_, i) => getOperation(i));
  };

  return <div className="fabrix wrapper">{renderContents()}</div>;
};

export type RendererCommonProps = {
  key: string;
  operation: FieldConfigs;
  variables: Record<string, unknown> | undefined;
  renderer?: Parameters<FabrixGetOperationFn>[1];
  getComponentFn: (
    op: FieldConfigs,
    data: FabrixComponentData,
    context: FabrixContextType,
  ) => FabrixGetComponentFn;
  extraClassName?: string;
};

const OperationRenderer = (props: RendererCommonProps) => {
  return props.operation.type === OperationTypeNode.MUTATION ? (
    <MutateOperationRenderer {...props} />
  ) : (
    <QueryOperationRenderer {...props} />
  );
};

const QueryOperationRenderer = ({
  operation,
  variables,
  renderer,
  getComponentFn,
}: RendererCommonProps) => {
  const context = useContext(FabrixContext);
  const { fetching, error, data } = useDataFetch({
    query: operation.document,
    variables,
  });

  if (fetching || !data) {
    return <Loader />;
  }

  if (error) {
    throw error;
  }

  const getComponent = getComponentFn(operation, data, context);
  return renderer
    ? renderer({ data, getComponent })
    : operation.fields.map((field) =>
        getComponent(field.name, {
          key: `fabrix-query-${operation.name}-${field.name}`,
        }),
      );
};

const MutateOperationRenderer = ({
  operation,
  renderer,
  getComponentFn,
}: RendererCommonProps) => {
  const context = useContext(FabrixContext);
  const getComponent = getComponentFn(operation, {}, context);
  return renderer
    ? renderer({ data: {}, getComponent })
    : operation.fields.map((field) =>
        getComponent(field.name, {
          key: `fabrix-mutation-${operation.name}-${field.name}`,
        }),
      );
};
