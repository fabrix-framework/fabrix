import { DirectiveNode, DocumentNode, OperationTypeNode } from "graphql";
import React, { ReactNode, useContext, useMemo } from "react";
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import { ChildComponentsRendererProps } from "@renderers/shared";
import { directiveSchemaMap } from "@directive/schema";
import { mergeFieldConfigs } from "@readers/shared";
import { getOutputFields, viewFieldMerger } from "@readers/field";
import {
  buildDefaultFormFieldConfigs,
  formFieldMerger,
  getInputFields,
} from "@readers/form";
import { AnyVariables, OperationResult, useMutation } from "urql";
import { FieldValues, FormProvider, Resolver, useForm } from "react-hook-form";
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
type RootFieldName<TData> =
  TData extends Record<string, unknown>
    ? Exclude<Extract<keyof TData, string>, "__typename">
    : string;

export type GetInputExtraProps = FabrixComponentChildrenExtraProps & {
  resolver?: Resolver;
};
export type GetOutputExtraProps = FabrixComponentChildrenExtraProps;

type GetActionFn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> =
  | (() => React.ReactNode)
  | ((props: {
      type: "handler";
    }) => () => Promise<void> | Promise<OperationResult<TData, TVariables>>);

export type GetInputFieldsRenderer<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> = (
  props: ChildComponentsRendererProps & {
    getAction: GetActionFn<TData, TVariables>;
  },
) => ReactNode;
export type GetInputFn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> = (
  extraProps?: GetInputExtraProps,
  fieldsRenderer?: GetInputFieldsRenderer<TData, TVariables>,
) => React.ReactNode;

export type GetOutputFieldsRenderer = (
  props: ChildComponentsRendererProps,
) => React.ReactNode;
export type GetOutputFn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = (
  rootFieldName: RootFieldName<TData>,
  extraProps?: GetOutputExtraProps,
  fieldsRenderer?: GetOutputFieldsRenderer,
) => React.ReactNode;

export type FabrixComponentChildrenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
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
  getInput: GetInputFn<TData, TVariables>;

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
  getOutput: GetOutputFn<TData>;
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
              getInputComponent: getInputComponentFn(
                props,
                (rendererFnProps) => (
                  <FormRenderer
                    {...buildCommonProps(rendererFnProps)}
                    context={context}
                    executeQuery={rendererFnProps.executeQuery}
                    fieldsRenderer={rendererFnProps.fieldsRenderer}
                  />
                ),
              ),
              getOutputComponent: getOutputComponentFn(props, () => void 0),
            };
          }

          case "view": {
            return {
              getInputComponent: getInputComponentFn(props, () => void 0),
              getOutputComponent: getOutputComponentFn(
                props,
                (rendererFnProps) => (
                  <ViewRenderer
                    {...buildCommonProps(rendererFnProps)}
                    context={context}
                    data={rendererFnProps.data}
                    fieldsRenderer={rendererFnProps.fieldsRenderer}
                  />
                ),
              ),
            };
          }

          case "generic": {
            return {
              getInputComponent: getInputComponentFn(
                props,
                (rendererFnProps) => {
                  const commonProps = buildCommonProps(rendererFnProps);

                  return (
                    <FormRenderer
                      {...{
                        ...commonProps,
                        rootField: {
                          ...commonProps.rootField,
                          fields: rendererFnProps.field.configs.inputFields,
                        },
                      }}
                      context={context}
                      executeQuery={rendererFnProps.executeQuery}
                      fieldsRenderer={rendererFnProps.fieldsRenderer}
                    />
                  );
                },
              ),
              getOutputComponent: getOutputComponentFn(
                props,
                (rendererFnProps) => (
                  <ViewRenderer
                    {...buildCommonProps(rendererFnProps)}
                    context={context}
                    data={rendererFnProps.data}
                    fieldsRenderer={rendererFnProps.fieldsRenderer}
                  />
                ),
              ),
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
    getInputComponent: ReturnType<
      typeof getInputComponentFn<TData, TVariables>
    >;
    getOutputComponent: ReturnType<
      typeof getOutputComponentFn<TData, TVariables>
    >;
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
    const executeQuery = (input: Record<string, unknown>) => {
      if (operation.type === OperationTypeNode.QUERY) {
        return Promise.resolve(
          dataFetch.refetch({
            requestPolicy: "network-only",
          }),
        );
      } else if (operation.type === OperationTypeNode.MUTATION) {
        return runMutation(input as TVariables);
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
      executeQueryWithInput: executeQuery,
    });

    if (props.children) {
      return props.children({
        data: dataFetch.data ?? ({} as TData),
        getInput: inputComponent,
        getOutput: outputComponent,
      });
    }

    return operation.fields.map((field) => (
      <div key={field.name} className="fabrix-component">
        {inputComponent({
          key: `fabrix-${operation.name}-input-${field.name}`,
        })}
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
};

type RendererComponentCommonProps = {
  fetching: boolean;
  error: Error | undefined;
};

type OutputComponentRendererFnProps = RendererFnCommonProps & {
  data: Value;
  fieldsRenderer?: GetOutputFieldsRenderer;
};
type OutputComponentFnProps = RendererComponentCommonProps & {
  data: FabrixComponentData | undefined;
};

export type ExecuteQueryResult<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> = Promise<void> | Promise<OperationResult<TData, TVariables>>;

type InputComponentRendererFnProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> = RendererFnCommonProps & {
  executeQuery: () => Promise<void>;
  fieldsRenderer?: GetInputFieldsRenderer<TData, TVariables>;
};
type InputComponentFnProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> = RendererComponentCommonProps & {
  executeQueryWithInput: (
    input: FieldValues,
  ) => ExecuteQueryResult<TData, TVariables>;
};

export const getOutputComponentFn =
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TData = any,
    TVariables extends AnyVariables = AnyVariables,
  >(
    props: FabrixComponentProps<TData, TVariables>,
    rendererFn: (props: OutputComponentRendererFnProps) => React.ReactNode,
  ) =>
  (operation: Operation, componentProps: OutputComponentFnProps) =>
  (...args: Parameters<GetOutputFn>): React.ReactNode => {
    const [name, extraProps, fieldsRenderer] = args;
    const field = operation.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`No root field found for name: ${name}`);
    }

    return (
      <div
        key={extraProps?.key}
        className={`fabrix-output-container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
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
          fieldsRenderer,
        })}
      </div>
    );
  };

export const getInputComponentFn =
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TData = any,
    TVariables extends AnyVariables = AnyVariables,
  >(
    props: FabrixComponentProps<TData, TVariables>,
    rendererFn: (
      props: InputComponentRendererFnProps<TData, TVariables>,
    ) => React.ReactNode,
  ) =>
  (
    operation: Operation,
    componentProps: InputComponentFnProps<TData, TVariables>,
  ) =>
  (...args: Parameters<GetInputFn<TData, TVariables>>): React.ReactNode => {
    const [extraProps, fieldsRenderer] = args;
    const field = operation.fields[0];
    const formContext = useForm({
      resolver: extraProps?.resolver, // ajvResolver(buildAjvSchema(rootField.fields)),
    });

    return (
      <div
        key={extraProps?.key}
        className={`fabrix-input-container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
      >
        <FormProvider {...formContext}>
          {rendererFn({
            field,
            fetching: componentProps.fetching,
            error: componentProps.error,
            executeQuery: () =>
              formContext.handleSubmit(async (data) =>
                componentProps.executeQueryWithInput(data),
              )(),
            fieldsRenderer,
          })}
        </FormProvider>
      </div>
    );
  };
