<<<<<<< HEAD
import { DirectiveNode, DocumentNode, OperationTypeNode, parse } from "graphql";
import { ReactNode, useCallback, useContext, useMemo } from "react";
||||||| parent of 8ca3de2 (Remove getOperation function)
import { DirectiveNode, DocumentNode, OperationTypeNode } from "graphql";
import { ReactNode, useCallback, useContext, useMemo } from "react";
=======
import { DirectiveNode, DocumentNode, OperationTypeNode } from "graphql";
import { ReactNode, useContext, useMemo } from "react";
>>>>>>> 8ca3de2 (Remove getOperation function)
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import { FabrixComponentFieldsRenderer, Loader } from "@renderers/shared";
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
export type FieldConfigs = {
  name: string;
  document: DocumentNode;
  type: OperationTypeNode;
  fields: FieldConfig[];
};

export const useFieldConfigs = (query: DocumentNode | string) => {
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

  children?: (props: FabrixComponentChildrenProps) => ReactNode;
};

type FabrixComponentChildrenExtraProps = { key?: string; className?: string };

<<<<<<< HEAD
type FabrixGetComponentFn = (
  /**
   * The name that corresponds to the GQL query.
   */
  name: string,
  extraProps?: FabrixComponentChildrenExtraProps,
  fieldsRenderer?: FabrixComponentFieldsRenderer,
) => ReactNode;

export type FabrixGetOperationFn = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  indexOrName: number | string,
  renderer?: (props: {
    data: T;
    getComponent: FabrixGetComponentFn;
  }) => ReactNode,
) => ReactNode;

export type FabrixComponentChildrenProps = {
||||||| parent of 8ca3de2 (Remove getOperation function)
type FabrixGetComponentFn = (
  /**
   * The name that corresponds to the GQL query.
   */
  name: string,
  extraProps?: FabrixComponentChildrenExtraProps,
  fieldsRenderer?: FabrixComponentFieldsRenderer,
) => ReactNode;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FabrixGetOperationFn<TData = any> = (
  indexOrName: number | string,
  renderer?: (props: {
    data: TData;
    getComponent: FabrixGetComponentFn;
  }) => ReactNode,
) => ReactNode;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FabrixComponentChildrenProps<TData = any> = {
=======
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FabrixComponentChildrenProps<TData = any> = {
>>>>>>> 8ca3de2 (Remove getOperation function)
  /**
   * The data fetched from the query
   */
<<<<<<< HEAD
  getOperation: FabrixGetOperationFn;
||||||| parent of 8ca3de2 (Remove getOperation function)
  getOperation: FabrixGetOperationFn<TData>;
=======
  data: TData;
>>>>>>> 8ca3de2 (Remove getOperation function)

  /**
   * Get the component by root field name
   *
   * ```tsx
   * <FabrixComponent query={getUsersQuery}>
   *   {({ getComponent }) => (
   *     {getComponent("users")}
   *   )}
   * </FabrixComponent>
   * ```
   */
  getComponent: (
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
export const FabrixComponent = (props: FabrixComponentProps) => {
  const renderComponent = getComponentRendererFn(
    props,
    getComponentFn(
      props,
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
    ),
  );

  return <div className="fabrix wrapper">{renderComponent()}</div>;
};

export const getComponentRendererFn = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
>(
  props: FabrixComponentProps<TData>,
  getComponent: ReturnType<typeof getComponentFn>,
) => {
  const context = useContext(FabrixContext);
  const { fieldConfigs } = useFieldConfigs(props.query);
<<<<<<< HEAD
  const getOperation: FabrixComponentChildrenProps["getOperation"] =
    useCallback(
      (indexOrName, renderer) => {
        const fieldConfig =
          typeof indexOrName === "number"
            ? fieldConfigs[indexOrName]
            : fieldConfigs.find(({ name }) => name == indexOrName);
        if (!fieldConfig) {
          throw new Error(`No operation found for indexOrName: ${indexOrName}`);
        }

        return (
          <OperationRenderer
            key={`fabrix-operation${typeof indexOrName === "number" ? `-${indexOrName}` : ""}-${fieldConfig.name}`}
            operation={fieldConfig}
            variables={props.variables}
            getComponentFn={getComponent}
            renderer={renderer as Parameters<FabrixGetOperationFn>[1]}
          />
        );
      },
      [fieldConfigs, props.variables],
    );
||||||| parent of 8ca3de2 (Remove getOperation function)
  const getOperation: FabrixComponentChildrenProps["getOperation"] =
    useCallback(
      (indexOrName, renderer) => {
        const fieldConfig =
          typeof indexOrName === "number"
            ? fieldConfigs[indexOrName]
            : fieldConfigs.find(({ name }) => name == indexOrName);
        if (!fieldConfig) {
          throw new Error(`No operation found for indexOrName: ${indexOrName}`);
        }

        return (
          <OperationRenderer
            key={`fabrix-operation${typeof indexOrName === "number" ? `-${indexOrName}` : ""}-${fieldConfig.name}`}
            operation={fieldConfig}
            variables={props.variables}
            getComponentFn={getComponent}
            renderer={renderer}
          />
        );
      },
      [fieldConfigs, props.variables],
    );
=======
  const fieldConfig = fieldConfigs[0];
  if (!fieldConfig) {
    throw new Error(`No operation found`);
  }
>>>>>>> 8ca3de2 (Remove getOperation function)

  return () => {
    const { fetching, error, data } = useDataFetch({
      query: fieldConfig.document,
      variables: props.variables,
      pause: fieldConfig.type !== OperationTypeNode.QUERY,
    });

    if (fetching) {
      return <Loader />;
    }

    if (error) {
      throw error;
    }

    const component = getComponent(fieldConfig, data, context);
    if (props.children) {
      return props.children({
        data: data as TData,
        getComponent: component,
      });
    }

    return fieldConfig.fields.map((field) =>
      component(field.name, {
        key: `fabrix-${fieldConfig.name}-${field.name}`,
      }),
    );
  };
};

type RendererFn = (
  field: FieldConfig,
  data: Value,
  context: FabrixContextType,
  componentFieldsRenderer?: FabrixComponentFieldsRenderer,
) => ReactNode;

export const getComponentFn =
  (props: FabrixComponentProps, rendererFn: RendererFn) =>
  (
    fieldConfig: FieldConfigs,
    data: FabrixComponentData | undefined,
    context: FabrixContextType,
  ) =>
  (
    name: string,
    extraProps?: FabrixComponentChildrenExtraProps,
    componentFieldsRenderer?: FabrixComponentFieldsRenderer,
  ) => {
    const field = fieldConfig.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`No root field found for name: ${name}`);
    }

    const dataByName = data ? (name in data ? data[name] : {}) : {};

    return (
      <div
        key={extraProps?.key}
        className={`fabrix renderer container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
      >
        {rendererFn(field, dataByName, context, componentFieldsRenderer)}
      </div>
    );
  };
