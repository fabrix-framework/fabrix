import { Path } from "@visitor/path";
import { z } from "zod";

const defaultValues = {
  gridCol: 12,
  hidden: false,
};

export const baseFieldSchema = z.object({
  label: z.string().nullish(),
  index: z.number().nullish(),
  hidden: z
    .boolean()
    .nullish()
    .transform((v) => v ?? defaultValues.hidden),
  componentType: z
    .object({
      name: z.string().nullish(),
      props: z
        .array(z.object({ name: z.string(), value: z.string() }))
        .optional(),
    })
    .nullish(),
});

export const formFieldSchema = baseFieldSchema.merge(
  z.object({
    gridCol: z
      .number()
      .nullish()
      .transform((v) => v ?? defaultValues.gridCol),
    placeholder: z.string().nullish(),
    defaultValue: z.string().nullish(),
  }),
);

export const formFieldConstraintSchema = z
  .object({
    // String constraints
    minLength: z.number().nullish(),
    maxLength: z.number().nullish(),
    pattern: z.string().nullish(),
    format: z.string().nullish(),

    // Number constraints
    min: z.number().nullish(),
    max: z.number().nullish(),
    exclusiveMin: z.number().nullish(),
    exclusiveMax: z.number().nullish(),
    multipleOf: z.number().nullish(),

    // String/Number constraints
    oneOf: z.array(z.string().or(z.number())).nullish(),
  })
  .nullish();

export const viewFieldSchema = baseFieldSchema.merge(
  z.object({
    gridCol: z
      .number()
      .nullish()
      .transform((v) => v ?? defaultValues.gridCol),
  }),
);

export type BaseFieldSchema = z.infer<typeof baseFieldSchema>;
export type ViewFieldSchema = z.infer<typeof viewFieldSchema>;
export type FormFieldSchema = z.infer<typeof formFieldSchema>;

/**
 * Schema definitions for the directive arguments
 */
export const directiveSchemaMap = {
  /**
   * Schema for `@fabrixView` directive
   */
  fabrixView: {
    schema: z.object({
      input: z.array(
        z.object({
          field: z.string().transform((value) => {
            return new Path(value.split("."));
          }),
          config: viewFieldSchema.nullish().transform(
            (v) =>
              v ?? {
                gridCol: defaultValues.gridCol,
                hidden: defaultValues.hidden,
              },
          ),
        }),
      ),
    }),
  },

  /**
   * Schema for `@fabrixForm` directive
   */
  fabrixForm: {
    schema: z.object({
      input: z.array(
        z.object({
          field: z.string().transform((value) => {
            return new Path(value.split("."));
          }),
          config: formFieldSchema.nullish().transform(
            (v) =>
              v ?? {
                gridCol: defaultValues.gridCol,
                hidden: defaultValues.hidden,
              },
          ),
          constraint: formFieldConstraintSchema,
        }),
      ),
    }),
  },
} as const;
