import { fallbackDefault } from "@directive/zod";
import { Path } from "@visitor";
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
    .transform(fallbackDefault(defaultValues.hidden)),
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
      .transform(fallbackDefault(defaultValues.gridCol)),
    placeholder: z.string().nullish(),
    defaultValue: z.string().nullish(),
  }),
);

export const formFieldConstraintSchema = z
  .object({
    // String constraints
    minLength: z.number().nullish(),
    maxLength: z.number().nullish(),
    startsWith: z.string().nullish(),
    endsWith: z.string().nullish(),
    contains: z.string().nullish(),
    notContais: z.string().nullish(),
    pattern: z.string().nullish(),
    format: z.string().nullish(),

    // Number constraints
    min: z.number().nullish(),
    max: z.number().nullish(),
    exclusiveMin: z.number().nullish(),
    exclusiveMax: z.number().nullish(),
  })
  .nullish();

export const viewFieldSchema = baseFieldSchema.merge(
  z.object({
    gridCol: z
      .number()
      .nullish()
      .transform(fallbackDefault(defaultValues.gridCol)),
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
            fallbackDefault({
              gridCol: defaultValues.gridCol,
              hidden: defaultValues.hidden,
            }),
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
            fallbackDefault({
              gridCol: defaultValues.gridCol,
              hidden: defaultValues.hidden,
            }),
          ),
          constraint: formFieldConstraintSchema,
        }),
      ),
    }),
  },
} as const;
