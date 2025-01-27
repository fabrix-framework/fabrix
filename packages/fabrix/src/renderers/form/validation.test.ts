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

  it("should return a schema with a single string field", () => {
    expect(
      buildAjvSchema([
        {
          field: new Path(["name"]),
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
      ]),
    ).toEqual({
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 3,
          maxLength: 5,
        },
      },
      required: ["name"],
      additionalProperties: true,
    });
  });

  it("should return a valid schema with nested fields (2 level)", () => {
    expect(
      buildAjvSchema([
        {
          field: new Path(["input", "name"]),
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
      ]),
    ).toEqual({
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 3,
              maxLength: 5,
            },
          },
          required: ["name"],
          additionalProperties: true,
        },
      },
      required: [],
      additionalProperties: true,
    });
  });

  it("should return a valid schema with nested fields (3 level)", () => {
    expect(
      buildAjvSchema([
        {
          field: new Path(["input", "name", "first"]),
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
      ]),
    ).toEqual({
      type: "object",
      properties: {
        input: {
          type: "object",
          properties: {
            name: {
              type: "object",
              properties: {
                first: {
                  type: "string",
                  minLength: 3,
                  maxLength: 5,
                },
              },
              required: ["first"],
              additionalProperties: true,
            },
          },
          required: [],
          additionalProperties: true,
        },
      },
      required: [],
      additionalProperties: true,
    });
  });
});
