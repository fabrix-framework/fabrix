import { DirectiveNode, DocumentNode, OperationTypeNode } from "graphql";
import { ReactNode, useContext, useMemo } from "react";
import { findDirective, parseDirectiveArguments } from "@directive";
import { ViewRenderer } from "@renderers/fields";
import { FormRenderer } from "@renderers/form";
import { FabrixContext, FabrixContextType } from "@context";
import { FabrixComponentFieldsRenderer, Loader } from "@renderers/shared";
import { directiveSchemaMap } from "@directive/schema";
import { mergeFieldConfigs } from "@readers/shared";
import { getOutputFields, viewFieldMerger } from "@readers/field";
import {
  buildDefaultFormFieldConfigs,
  formFieldMerger,
  getInputFields,
} from "@readers/form";
import {
  buildRootDocument,
  FieldVariables,
  GeneralDocumentType,
} from "@/visitor";
import { Field, Fields } from "@/visitor/fields";
import { FabrixComponentData, useDataFetch, Value } from "@/fetcher";
import { get } from "http";

const decideStrategy = (
  directiveNodes: readonly DirectiveNode[],
  opType: OperationTypeNode,
) => {
  const directive = findDirective(directiveNodes);
  const emptyDirective = { arguments: null } as const;

  if (directive === null) {
    return {
      type: "generic",
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TVariables = Record<string, any>,
>(
  props: FabrixComponentProps<TData, TVariables>,
) => {
  const buildCommonProps = ({
    context,
    field,
    data,
    componentFieldsRenderer,
  }: RendererFnProps) => {
    return {
      context,
      rootField: {
        name: field.name,
        fields: field.configs.outputFields,
        data,
        document: field.document,
        className: props.contentClassName,
        componentFieldsRenderer,
      },
    };
  };

  return (
    <div className="fabrix wrapper">
      {getComponentRendererFn(props, (field: FieldConfig) => {
        switch (field.type) {
          case "form": {
            return {
              getInputComponent: getComponentFn(props, (rendererFnProps) => (
                <FormRenderer {...buildCommonProps(rendererFnProps)} />
              )),
              getOutputComponent: getComponentFn(props, () => void 0),
            };
          }

          case "view": {
            return {
              getInputComponent: getComponentFn(props, () => void 0),
              getOutputComponent: getComponentFn(props, (rendererFnProps) => (
                <ViewRenderer {...buildCommonProps(rendererFnProps)} />
              )),
            };
          }

          case "generic": {
            return {
              getInputComponent: getComponentFn(props, () => (
                <div>TODO: form here</div>
              )),
              getOutputComponent: getComponentFn(props, (rendererFnProps) => (
                <ViewRenderer {...buildCommonProps(rendererFnProps)} />
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TVariables = Record<string, any>,
>(
  props: FabrixComponentProps<TData, TVariables>,
  componentsResolver: (field: FieldConfig) => {
    getInputComponent: ReturnType<typeof getComponentFn>;
    getOutputComponent: ReturnType<typeof getComponentFn>;
  },
) => {
  const context = useContext(FabrixContext);
  const { operations } = useOperation(props.query);
  const operation = operations[0];
  if (!operation) {
    throw new Error(`No operation found`);
  }

  const initialField = operation.fields[0];
  if (!initialField) {
    throw new Error(`No field found`);
  }

  return () => {
    const { executeQuery, fetching, error, data } = useDataFetch<
      TData,
      TVariables
    >({
      query: operation.document,
      variables: props.variables,
      pause: operation.type !== OperationTypeNode.QUERY,
    });

    if (fetching) {
      return <Loader />;
    }

    if (error) {
      throw error;
    }

    const resolvedComponnents = componentsResolver(initialField);
    const outputComponent = resolvedComponnents.getOutputComponent(
      operation,
      data ?? {},
      context,
    );
    const inputComponent = resolvedComponnents.getInputComponent(
      operation,
      data ?? {},
      context,
    );

    if (props.children) {
      return props.children({
        data: data ?? ({} as TData),
        getInput: outputComponent,
        getOutput: inputComponent,
      });
    }

    return operation.fields.map((field) => (
      <div key={field.name}>
        {inputComponent(field.name, {
          key: `fabrix-${operation.name}-input-${field.name}`,
        })}
        {outputComponent(field.name, {
          key: `fabrix-${operation.name}-output-${field.name}`,
        })}
      </div>
    ));
  };
};

type RendererFnProps = {
  field: FieldConfig;
  data: Value;
  context: FabrixContextType;
  componentFieldsRenderer?: FabrixComponentFieldsRenderer;
};
type RendererFn = (props: RendererFnProps) => ReactNode;

export const getComponentFn =
  <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TData = any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TVariables = Record<string, any>,
  >(
    props: FabrixComponentProps<TData, TVariables>,
    rendererFn: RendererFn,
  ) =>
  (
    operation: Operation,
    data: FabrixComponentData | undefined,
    context: FabrixContextType,
  ) =>
  (
    name: string,
    extraProps?: FabrixComponentChildrenExtraProps,
    componentFieldsRenderer?: FabrixComponentFieldsRenderer,
  ) => {
    const field = operation.fields.find((f) => f.name === name);
    if (!field) {
      throw new Error(`No root field found for name: ${name}`);
    }

    return (
      <div
        key={extraProps?.key}
        className={`fabrix renderer container ${props.containerClassName ?? ""} ${extraProps?.className ?? ""}`}
      >
        {rendererFn({
          field,
          data: data ? (name in data ? data[name] : {}) : {},
          context,
          componentFieldsRenderer,
        })}
      </div>
    );
  };
