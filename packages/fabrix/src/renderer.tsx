import { DirectiveNode, DocumentNode, OperationTypeNode } from "graphql";
import React, { ReactNode, useContext, useMemo } from "react";
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import { directiveSchemaMap } from "@directive/schema";
import { mergeFieldConfigs } from "@readers/shared";
import { getOutputFields, viewFieldMerger } from "@readers/field";
import { formFieldMerger, getInputFields } from "@readers/form";
import { AnyVariables, OperationResult, useMutation } from "urql";
import {
  FieldPath,
  FieldValues,
  FormProvider,
  FormState,
  Path,
  useForm,
  UseFormRegisterReturn,
  UseFormReturn,
} from "react-hook-form";
import { DirectiveAttributes } from "@registry";
import { ajvResolver } from "@renderers/form/ajvResolver";
import { buildAjvSchema } from "@renderers/form/validation";
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
            getInputFields(context, fieldVariables),
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
  TVariables extends AnyVariables = AnyVariables,
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

  /**
   * The children to render the query
   */
  children?: (
    props: FabrixComponentChildrenProps<TData, TVariables>,
  ) => ReactNode;
};

export type RootFieldName<TData> =
  TData extends Record<string, unknown>
    ? Exclude<Extract<keyof TData, string>, "__typename">
    : string;

export type ChildComponentsExtraProps = Partial<DirectiveAttributes> & {
  key?: string;
};
export type GetInputExtraProps = ChildComponentsExtraProps;
export type GetOutputExtraProps = ChildComponentsExtraProps;

export type GetInputFieldsRendererProps<
  TVariables extends AnyVariables = AnyVariables,
> = {
  /**
   * Direct access to the control object from react-hook-form
   */
  formContext: UseFormReturn<
    TVariables extends FieldValues ? TVariables : Record<string, unknown>
  >;

  /**
   * Get the field by name
   *
   * @example
   * ```tsx
   * <FabrixComponent query={appQuery}>
   *   {({ getComponent }) => (
   *     <>
   *       {getComponent("getEmployee", {}, ({ getField }) => (
   *         <>
   *           {getField("displayName")}
   *           {getField("email")}
   *         </>
   *       ))}
   *     </>
   *   )}
   * </FabrixComponent>
   * ```
   */
  getField: (
    /**
     * The name of the field
     */
    name: Path<TVariables extends FieldValues ? TVariables : FieldValues>,
    extraProps?: GetInputExtraProps,
  ) => UseFormRegisterReturn;

  /**
   * Get the field component by name
   *
   * @example
   * ```tsx
   * <FabrixComponent query={appQuery}>
   *   {({ getInput }) => (
   *     getInput({}, ({ Field }) => (
   *       <Field name="displayName" />
   *       <Field name="email" />
   *     ))
   *   )}
   * </FabrixComponent>
   * ```
   */
  Field: (props: {
    name: Path<TVariables extends FieldValues ? TVariables : FieldValues>;
    extraProps?: GetInputExtraProps;
  }) => React.ReactNode;

  /**
   * Get the action handler for the query
   *
   * @example
   * ```tsx
   * <FabrixComponent query={appQuery}>
   *   {({ getInput }) => (
   *     getInput({}, ({ getAction, Field }) => (
   *       <Field name="input.name" />
   *       <Field name="input.email" />
   *       <Button {...getAction()}>Submit</Button>
   *     ))
   *   )}
   * </FabrixComponent>
   * ```
   */
  getAction: () => {
    getState: () => FormState<
      TVariables extends FieldValues ? TVariables : FieldValues
    >;
    onClick: () => Promise<void>;
  };
};
export type GetInputFieldsRenderer<
  TVariables extends AnyVariables = AnyVariables,
> = (props: GetInputFieldsRendererProps<TVariables>) => ReactNode;

export type GetInputFn<TVariables extends AnyVariables = AnyVariables> = (
  extraProps?: GetInputExtraProps,
  fieldsRenderer?: GetInputFieldsRenderer<TVariables>,
) => React.ReactNode;

/*
 * An utility type to get the data right under the root field
 */
type DataAtTheRoot<TData> =
  TData extends Record<string, unknown>
    ? TData[RootFieldName<TData>]
    : Record<string, unknown>;

type FieldPathsWithoutTypename<T> = Exclude<
  FieldPath<
    NonNullable<T> extends FieldValues
      ? NonNullable<T>
      : Record<string, unknown>
  >,
  "__typename"
>;

export type GetOutputFieldsRendererProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = {
  /**
   * The data fetched from the query
   */
  data: DataAtTheRoot<TData>;

  /**
   * Get the field component by name
   *
   * @example
   * ```tsx
   * <FabrixComponent query={appQuery}>
   *   {({ getInput }) => (
   *     getInput({}, ({ Field }) => (
   *       <Field name="displayName" />
   *       <Field name="email" />
   *     ))
   *   )}
   * </FabrixComponent>
   * ```
   */
  Field: (props: {
    name: FieldPathsWithoutTypename<DataAtTheRoot<TData>>;
    extraProps?: GetOutputExtraProps;
  }) => React.ReactNode;
};

export type GetOutputFieldsRenderer<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = (props: GetOutputFieldsRendererProps<TData>) => React.ReactNode;

export type GetOutputFn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
> = (
  rootFieldName: RootFieldName<TData>,
  extraProps?: GetOutputExtraProps,
  fieldsRenderer?: GetOutputFieldsRenderer<TData>,
) => React.ReactNode;

export type FabrixComponentChildrenProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TData = any,
  TVariables extends AnyVariables = AnyVariables,
> = {
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
  getInput: GetInputFn<TVariables>;

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
    <div className={`fabrix-wrapper ${props.containerClassName ?? ""}`}>
      {getComponentRendererFn(props, operation, (field: FieldConfig) => {
        switch (field.type) {
          case "form": {
            return {
              getInputComponent: getInputComponentFn((rendererFnProps) => (
                <FormRenderer
                  {...buildCommonProps(rendererFnProps)}
                  context={context}
                  executeQuery={rendererFnProps.executeQuery}
                  fieldsRenderer={rendererFnProps.fieldsRenderer}
                />
              )),
              getOutputComponent: getOutputComponentFn(() => void 0),
            };
          }

          case "view": {
            return {
              getInputComponent: getInputComponentFn(() => void 0),
              getOutputComponent: getOutputComponentFn((rendererFnProps) => (
                <ViewRenderer
                  {...buildCommonProps(rendererFnProps)}
                  context={context}
                  data={rendererFnProps.data}
                  fieldsRenderer={rendererFnProps.fieldsRenderer}
                />
              )),
            };
          }

          case "generic": {
            return {
              getInputComponent: getInputComponentFn((rendererFnProps) => {
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
              }),
              getOutputComponent: getOutputComponentFn((rendererFnProps) => (
                <ViewRenderer
                  {...buildCommonProps(rendererFnProps)}
                  context={context}
                  data={rendererFnProps.data}
                  fieldsRenderer={rendererFnProps.fieldsRenderer}
                />
              )),
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
    getOutputComponent: ReturnType<typeof getOutputComponentFn<TData>>;
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
        getInput: inputComponent,
        getOutput: outputComponent,
      });
    }

    return operation.fields.map((field) => (
      <div key={field.name} className="fabrix-component">
        {inputComponent({
          key: `fabrix-${operation.name}-input-${field.name}`,
        })}
        {outputComponent(field.name as RootFieldName<TData>, {
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
  TVariables extends AnyVariables = AnyVariables,
> = RendererFnCommonProps & {
  executeQuery: () => Promise<void>;
  fieldsRenderer?: GetInputFieldsRenderer<TVariables>;
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
  >(
    rendererFn: (props: OutputComponentRendererFnProps) => React.ReactNode,
  ) =>
  (operation: Operation, componentProps: OutputComponentFnProps) =>
  (...args: Parameters<GetOutputFn<TData>>): React.ReactNode => {
    const [name, extraProps, fieldsRenderer] = args;
    const field = operation.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`No root field found for name: ${name}`);
    }

    return (
      <div
        key={extraProps?.key}
        className={`fabrix-output-container ${extraProps?.className ?? ""}`}
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
    rendererFn: (
      props: InputComponentRendererFnProps<TVariables>,
    ) => React.ReactNode,
  ) =>
  (
    operation: Operation,
    componentProps: InputComponentFnProps<TData, TVariables>,
  ) =>
  (...args: Parameters<GetInputFn<TVariables>>): React.ReactNode => {
    const [extraProps, fieldsRenderer] = args;
    const field = operation.fields[0];
    const buildSchema = () => {
      if (field.type === "form") {
        return buildAjvSchema(field.configs.outputFields);
      } else if (field.type === "generic") {
        return buildAjvSchema(field.configs.inputFields);
      } else {
        return;
      }
    };
    const schema = buildSchema();
    const formContext = useForm({
      resolver: schema && ajvResolver(schema),
    });

    return (
      <div
        key={extraProps?.key}
        className={`fabrix-input-container ${extraProps?.className ?? ""}`}
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
