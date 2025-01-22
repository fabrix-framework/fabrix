import { DirectiveNode, DocumentNode, OperationTypeNode } from "graphql";
import React, { ReactNode, useContext, useMemo } from "react";
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import { FabrixComponentFieldsRenderer } from "@renderers/shared";
import { directiveSchemaMap } from "@directive/schema";
import { mergeFieldConfigs } from "@readers/shared";
import { getOutputFields, viewFieldMerger } from "@readers/field";
import {
  buildDefaultFormFieldConfigs,
  formFieldMerger,
  getInputFields,
} from "@readers/form";
import { AnyVariables, OperationResult, useMutation } from "urql";
import {
  buildRootDocument,
  FieldVariables,
  GeneralDocumentType,
} from "@/visitor";
import { Field, Fields } from "@/visitor/fields";
import { FabrixComponentData, useDataFetch, Value } from "@/fetcher";

const decideStrategy = (
  directiveNodes: readonly DirectiveNode[],
  opType: OperationTypeNode,
) => {
  const directive = findDirective(directiveNodes);
  const emptyDirective = { arguments: null } as const;

  if (directive === null) {
    return {
      type: "generic",
      documentType: opType,
      directive: emptyDirective,
    };
  }

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
          inputFields: [],
          outputFields: mergeFieldConfigs(
            getOutputFields(childFields),
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
          inputFields: [],
          outputFields: mergeFieldConfigs(
            buildDefaultFormFieldConfigs(context, fieldVariables),
            directive.input,
            formFieldMerger,
          ),
        },
      };
    }
    case "generic": {
      return {
        name: field.getName(),
        type: strategy.type,
        configs: {
          documentType: strategy.documentType,
          inputFields: getInputFields(context, fieldVariables),
          outputFields: getOutputFields(childFields),
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
export type Operation = {
  name: string;
  document: DocumentNode;
  type: OperationTypeNode;
  fields: FieldConfig[];
};

export const useOperation = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TVariables = Record<string, any>,
>(
  query: GeneralDocumentType<TData, TVariables>,
) => {
  const rootDocument = buildRootDocument(query);
  const context = useContext(FabrixContext);
  const operations = useMemo(() => {
    return rootDocument.map(({ name, document, fields, opType, variables }) =>
      fields
        .unwrap()
        .filter((f) => !f.getParentName())
        .reduce<Operation>(
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

  return { operations };
};

type FabrixComponentCommonProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TVariables = Record<string, any>,
> = {
  /**
   * The variables to call the query with.
   */
  variables?: TVariables;

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

export type FabrixComponentProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TVariables = Record<string, any>,
> = FabrixComponentCommonProps<TVariables> & {
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
  query: GeneralDocumentType<TData, TVariables>;

  children?: (props: FabrixComponentChildrenProps<TData>) => ReactNode;
};

type FabrixComponentChildrenExtraProps = { key?: string; className?: string };

type GetComponentType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = (
  rootFieldName: TData extends Record<string, unknown>
    ? Exclude<Extract<keyof TData, string>, "__typename">
    : string,
  extraProps?: FabrixComponentChildrenExtraProps,
  fieldsRenderer?: FabrixComponentFieldsRenderer,
) => ReactNode;

export type FabrixComponentChildrenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = {
  /**
   * The data fetched from the query
   */
  data: TData;

  /**
   * Get the input component by the variable name
   *
   * ```tsx
   * <FabrixComponent query={getUsersQuery}>
   *   {({ getInput }) => (
   *     {getInput("input")}
   *   )}
   * </FabrixComponent>
   * ```
   */
  getInput: GetComponentType;

  /**
   * Get the component by root field name
   *
   * ```tsx
   * <FabrixComponent query={getUsersQuery}>
   *   {({ getOutput }) => (
   *     {getInput("users")}
   *   )}
   * </FabrixComponent>
   * ```
   */
  getOutput: GetComponentType<TData>;

  getAction: () => React.ReactNode;
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
export const FabrixComponent = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
>(
  props: FabrixComponentProps<TData, TVariables>,
) => {
  const buildCommonProps = ({
    field,
    fetching,
    error,
    componentFieldsRenderer,
  }: RendererFnCommonProps) => {
    return {
      fetching,
      error,
      rootField: {
        name: field.name,
        fields: field.configs.outputFields,
        document: field.document,
        className: props.contentClassName,
      },
      componentFieldsRenderer,
    };
  };

  const context = useContext(FabrixContext);
  const { operations } = useOperation(props.query);
  const operation = operations[0];
  if (!operation) {
    throw new Error(`No operation found`);
  }

  return (
    <div className="fabrix-wrapper">
      {getComponentRendererFn(props, operation, (field: FieldConfig) => {
        switch (field.type) {
          case "form": {
            return {
              getInputComponent: getComponentFn(props, (rendererFnProps) => (
                <FormRenderer
                  context={context}
                  {...buildCommonProps(rendererFnProps)}
                />
              )),
              getOutputComponent: getComponentFn(props, () => void 0),
              getActionComponent: () => () => null,
            };
          }

          case "view": {
            return {
              getInputComponent: getComponentFn(props, () => void 0),
              getOutputComponent: getComponentFn(props, (rendererFnProps) => (
                <ViewRenderer
                  context={context}
                  data={rendererFnProps.data}
                  {...buildCommonProps(rendererFnProps)}
                />
              )),
              getActionComponent:
                (operation, { executeQuery }) =>
                () => <button onClick={() => executeQuery()}>Submit</button>,
            };
          }

          case "generic": {
            return {
              getInputComponent: getComponentFn(props, (renderFnProps) => {
                const commonProps = buildCommonProps(renderFnProps);

                return (
                  <FormRenderer
                    context={context}
                    {...{
                      ...commonProps,
                      rootField: {
                        ...commonProps.rootField,
                        fields: renderFnProps.field.configs.inputFields,
                      },
                    }}
                  />
                );
              }),
              getOutputComponent: getComponentFn(props, (rendererFnProps) => (
                <ViewRenderer
                  context={context}
                  data={rendererFnProps.data}
                  {...buildCommonProps(rendererFnProps)}
                />
              )),
              getActionComponent:
                (operation, { executeQuery }) =>
                () => <button onClick={() => executeQuery()}>Submit</button>,
            };
          }
        }
      })()}
    </div>
  );
};

export const getComponentRendererFn = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
>(
  props: FabrixComponentProps<TData, TVariables>,
  operation: Operation,
  componentsResolver: (field: FieldConfig) => {
    getInputComponent: ReturnType<typeof getComponentFn>;
    getOutputComponent: ReturnType<typeof getComponentFn>;
    getActionComponent: (
      operation: Operation,
      props: {
        fetching: boolean;
        error: Error | undefined;
        executeQuery: () =>
          | Promise<void>
          | Promise<OperationResult<TData, TVariables>>;
      },
    ) => () => React.ReactNode;
  },
) => {
  const initialField = operation.fields[0];
  if (!initialField) {
    throw new Error(`No field found`);
  }

  return () => {
    const dataFetch = useDataFetch<TData, TVariables>({
      query: operation.document,
      variables: props.variables,
      pause: operation.type !== OperationTypeNode.QUERY,
    });

    const [mutationResult, runMutation] = useMutation<TData, TVariables>(
      operation.document,
    );
    const executeQuery = () => {
      if (operation.type === OperationTypeNode.QUERY) {
        return Promise.resolve(
          dataFetch.refetch({
            requestPolicy: "network-only",
          }),
        );
      } else if (operation.type === OperationTypeNode.MUTATION) {
        return runMutation(props.variables ?? ({} as TVariables));
      }

      return Promise.resolve();
    };

    const resolvedComponents = componentsResolver(initialField);
    const outputComponent = resolvedComponents.getOutputComponent(operation, {
      fetching: dataFetch.fetching,
      error: dataFetch.error,
      data: dataFetch.data ?? {},
    });
    const inputComponent = resolvedComponents.getInputComponent(operation, {
      fetching: mutationResult.fetching,
      error: mutationResult.error,
      data: mutationResult.data ?? {},
    });
    const actionComponent = resolvedComponents.getActionComponent(operation, {
      fetching: dataFetch.fetching || mutationResult.fetching,
      error: dataFetch.error || mutationResult.error,
      executeQuery,
    });

    if (props.children) {
      return props.children({
        data: dataFetch.data ?? ({} as TData),
        getInput: outputComponent,
        getOutput: inputComponent,
        getAction: actionComponent,
      });
    }

    return operation.fields.map((field) => (
      <div key={field.name} className="fabrix-component">
        {inputComponent(field.name, {
          key: `fabrix-${operation.name}-input-${field.name}`,
        })}
        {actionComponent()}
        {outputComponent(field.name, {
          key: `fabrix-${operation.name}-output-${field.name}`,
        })}
      </div>
    ));
  };
};

type RendererFnCommonProps = {
  field: FieldConfig;
  fetching: boolean;
  error: Error | undefined;
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
};

type RendererComponentCommonProps = {
  fetching: boolean;
  error: Error | undefined;
  data: FabrixComponentData | undefined;
};

export const getComponentFn =
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TData = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TVariables = Record<string, any>,
  >(
    props: FabrixComponentProps<TData, TVariables>,
    rendererFn: (
      props: RendererFnCommonProps & {
        data: Value;
      },
    ) => ReactNode,
  ) =>
  (operation: Operation, componentProps: RendererComponentCommonProps) =>
  (
    name: string,
    extraProps?: FabrixComponentChildrenExtraProps,
    componentFieldsRenderer?: FabrixComponentFieldsRenderer,
  ): React.ReactNode => {
    const field = operation.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`No root field found for name: ${name}`);
    }

    return (
      <div
        key={extraProps?.key}
        className={`fabrix-container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
      >
        {rendererFn({
          field,
          fetching: componentProps.fetching,
          error: componentProps.error,
          data: componentProps.data
            ? name in componentProps.data
              ? componentProps.data[name]
              : {}
            : {},
          componentFieldsRenderer,
        })}
      </div>
    );
  };
