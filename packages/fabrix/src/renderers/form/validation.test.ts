import { describe, expect, it } from "vitest";
import { Path } from "@visitor/path";
import { buildAjvSchema } from "./validation";

describe("buildAjvSchema", () => {
  it("empty input should return an empty schema", () => {
    expect(buildAjvSchema([])).toEqual({
      type: "object",
      properties: {},
      required: [],
      additionalProperties: true,
    });
  });

  const id = {
    input: {
      meta: {
        fieldType: { type: "Scalar", name: "ID" },
        isRequired: true,
      },
      constraint: null,
      config: {
        hidden: false,
        gridCol: 12,
      },
    },
    expected: {
      id: {
        type: "string",
      },
    },
  } as const;

  const name = {
    input: {
      meta: {
        fieldType: { type: "Scalar", name: "String" },
        isRequired: true,
      },
      constraint: { minLength: 3, maxLength: 5 },
      config: {
        hidden: false,
        gridCol: 12,
      },
    },
    expected: {
      name: {
        type: "string",
        minLength: 3,
        maxLength: 5,
      },
    },
  } as const;

  const age = {
    input: {
      meta: {
        fieldType: { type: "Scalar", name: "Int" },
        isRequired: false,
      },
      constraint: { min: 0, max: 65 },
      config: {
        hidden: false,
        gridCol: 12,
      },
    },
    expected: {
      age: {
        type: "number",
        minimum: 0,
        maximum: 65,
      },
    },
  } as const;

  it.each([
    [
      "fields - no level",
      [
        {
          field: new Path(["name"]),
          ...name.input,
        },
        {
          field: new Path(["age"]),
          ...age.input,
        },
      ],
      {
        type: "object",
        properties: {
          ...name.expected,
          ...age.expected,
        },
        required: ["name"],
        additionalProperties: true,
      },
    ],

    [
      "containing some nested fields - 2 level",
      [
        {
          field: new Path(["id"]),
          ...id.input,
        },
        {
          field: new Path(["input", "name"]),
          ...name.input,
        },
        {
          field: new Path(["input", "age"]),
          ...age.input,
        },
      ],
      {
        type: "object",
        properties: {
          ...id.expected,
          input: {
            type: "object",
            properties: {
              ...name.expected,
              ...age.expected,
            },
            required: ["name"],
            additionalProperties: true,
          },
        },
        required: ["id"],
        additionalProperties: true,
      },
    ],

    [
      "containing nested fields - 3 level",
      [
        {
          field: new Path(["id"]),
          ...id.input,
        },
        {
          field: new Path(["input", "id"]),
          ...id.input,
        },
        {
          field: new Path(["input", "nested", "name"]),
          ...name.input,
        },
        {
          field: new Path(["input", "nested", "age"]),
          ...age.input,
        },
      ],
      {
        type: "object",
        properties: {
          ...id.expected,
          input: {
            type: "object",
            properties: {
              ...id.expected,
              nested: {
                type: "object",
                properties: {
                  ...name.expected,
                  ...age.expected,
                },
                required: ["name"],
                additionalProperties: true,
              },
            },
            required: ["id"],
            additionalProperties: true,
          },
        },
        required: ["id"],
        additionalProperties: true,
      },
    ],
  ])("should return a schema (%s)", (_, input, expected) => {
    expect(buildAjvSchema(input)).toEqual(expected);
  });
});
