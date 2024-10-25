// Implementation copy-pasted from the original (https://github.com/react-hook-form/resolvers/blob/master/ajv/src/ajv.ts)
// we would like to extends Ajv to use ajv-formats for our requirements, but built-in RHF resolvers are not extendable.

import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers";
import Ajv, { DefinedError, JSONSchemaType, Options } from "ajv";
import ajvErrors from "ajv-errors";
import ajvFormats from "ajv-formats";
import {
  FieldError,
  FieldValues,
  ResolverOptions,
  ResolverResult,
  appendErrors,
} from "react-hook-form";

type Resolver = <T>(
  schema: JSONSchemaType<T>,
  schemaOptions?: Options,
  factoryOptions?: { mode?: "async" | "sync" },
) => <TFieldValues extends FieldValues, TContext>(
  values: TFieldValues,
  context: TContext | undefined,
  options: ResolverOptions<TFieldValues>,
) => Promise<ResolverResult<TFieldValues>>;

const parseErrorSchema = (
  ajvErrors: DefinedError[],
  validateAllFieldCriteria: boolean,
) => {
  // Ajv will return empty instancePath when require error
  ajvErrors.forEach((error) => {
    if (error.keyword === "required") {
      error.instancePath += "/" + error.params.missingProperty;
    }
  });

  return ajvErrors.reduce<Record<string, FieldError>>((previous, error) => {
    // `/deepObject/data` -> `deepObject.data`
    const path = error.instancePath.substring(1).replace(/\//g, ".");

    if (!previous[path]) {
      previous[path] = {
        message: error.message,
        type: error.keyword,
      };
    }

    if (validateAllFieldCriteria) {
      const types = previous[path].types;
      const messages = types && types[error.keyword];

      previous[path] = appendErrors(
        path,
        validateAllFieldCriteria,
        previous,
        error.keyword,
        messages
          ? ([] as string[]).concat(messages as string[], error.message || "")
          : error.message,
      ) as FieldError;
    }

    return previous;
  }, {});
};

export const ajvResolver: Resolver =
  (schema, schemaOptions, resolverOptions = {}) =>
  async (values, _, options) => {
    const ajv = new Ajv(
      Object.assign(
        {},
        {
          allErrors: true,
          validateSchema: true,
        },
        schemaOptions,
      ),
    );

    ajvErrors(ajv);
    ajvFormats(ajv);

    const validate = ajv.compile(
      Object.assign(
        { $async: resolverOptions && resolverOptions.mode === "async" },
        schema,
      ),
    );

    const valid = validate(values);

    if (options.shouldUseNativeValidation) {
      validateFieldsNatively({}, options);
    }

    return Promise.resolve(
      valid
        ? { values, errors: {} }
        : {
            values: {},
            errors: toNestErrors(
              parseErrorSchema(
                validate.errors as DefinedError[],
                !options.shouldUseNativeValidation &&
                  options.criteriaMode === "all",
              ),
              options,
            ),
          },
    );
  };
