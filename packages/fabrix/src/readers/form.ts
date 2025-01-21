import { FabrixContextType } from "@context";
import {
  formFieldConstraintSchema,
  FormFieldSchema,
  formFieldSchema,
} from "@directive/schema";
import { resolveFieldType } from "@renderers/typename";
import { FieldVariables } from "@visitor";
import { Path } from "@visitor/path";
import { deepmerge } from "deepmerge-ts";
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLType,
} from "graphql";
import { z } from "zod";
import { FieldConfigWithMeta, FieldConfig } from "./shared";

const buildFieldMeta = (type: GraphQLType) => ({
  fieldType: resolveFieldType(
    type instanceof GraphQLNonNull ? type.ofType : type,
  ),
  isRequired: type instanceof GraphQLNonNull,
});

export type FieldMeta = ReturnType<typeof buildFieldMeta> | null;

/**
 * Infer the field configuration from the input object type for the form
 */
export const buildDefaultFormFieldConfigs = (
  context: FabrixContextType,
  fieldVariables: FieldVariables,
) => {
  if (!("input" in fieldVariables)) {
    return [];
  }

  if (context.schemaLoader.status === "loading") {
    return [];
  }

  const inputType = context.schemaLoader.schemaSet.serverSchema.getType(
    fieldVariables.input.type.name,
  );
  if (!inputType) {
    return [];
  }

  // Only support object type for "input" argument
  if (!(inputType instanceof GraphQLInputObjectType)) {
    return [];
  }

  const fields = inputType.getFields();
  return Object.keys(fields).map((key, index) => {
    const field = fields[key];
    const path = new Path(key.split("."));

    return {
      field: path,
      meta: buildFieldMeta(field.type),
      config: formFieldSchema.parse({
        index,
        label: field.name,
      }),
    };
  });
};

export type FormFieldExtra = {
  constraint?: z.infer<typeof formFieldConstraintSchema>;
};

export const formFieldMerger = (
  fieldValue: FieldConfigWithMeta<FormFieldSchema> | undefined,
  directiveValue: FieldConfig<FormFieldSchema, FormFieldExtra> | undefined,
) => {
  if (fieldValue && directiveValue) {
    return {
      config: deepmerge(fieldValue.config, directiveValue.config),
      meta: fieldValue.meta,
      constraint: directiveValue.constraint,
    };
  } else if (fieldValue) {
    return {
      config: fieldValue.config,
      meta: fieldValue.meta,
    };
  } else if (directiveValue) {
    return {
      config: directiveValue.config,
      meta: null,
      constraint: directiveValue.constraint,
    };
  } else {
    return null;
  }
};

export const getInputFields = (
  context: FabrixContextType,
  fieldVariables: FieldVariables,
) => {
  const formName = Object.keys(fieldVariables);
  if (formName.length === 0) {
    return [];
  }

  return formName.flatMap((name) => {
    const fieldType = fieldVariables[name].type;
    const resolved = resolveInputType(context, fieldType);
    if (!resolved) {
      return [];
    }

    const formFields = extractFormFields(name, resolved.type);
    if (!formFields) {
      return [];
    }

    return formFields;
  });
};

const resolveInputType = (
  context: FabrixContextType,
  props: {
    name: string;
    isNull: boolean;
    isList: boolean;
  },
) => {
  if (context.schemaLoader.status === "loading") {
    return null;
  }

  const type = context.schemaLoader.schemaSet.serverSchema.getType(props.name);

  // handling variation of GraphQLNamedInputType
  if (type instanceof GraphQLScalarType) {
    return {
      type,
      fieldType: resolveFieldType(type),
      isRequired: !props.isNull,
    };
  } else if (type instanceof GraphQLEnumType) {
    return {
      type,
      fieldType: resolveFieldType(type),
      isRequired: !props.isNull,
    };
  } else if (type instanceof GraphQLInputObjectType) {
    return {
      type,
      fieldType: {
        // TODO: here should be input object type
        type: "Object" as const,
        name: type.name,
      },
      isRequired: !props.isNull,
    };
  }

  return null;
};

const extractFormFields = (basePath: string, field: GraphQLNamedType) => {
  if (field instanceof GraphQLInputObjectType) {
    const fields = field.getFields();
    return Object.keys(fields).map((key) => {
      const field = fields[key];

      return {
        field: new Path([basePath, ...key.split(".")]),
        meta: buildFieldMeta(field.type),
        config: {
          label: key,
          gridCol: 12,
          hidden: false,
        },
      };
    });
  }

  return null;
};
