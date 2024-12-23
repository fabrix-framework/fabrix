import { describe, it, expect } from "vitest";
import { mockSchema } from "../../__tests__/mocks/handlers";
import { buildTypenameExtractor } from "./typename";

const schemaSet = {
  serverSchema: mockSchema,
};

describe("typenamesByPath", () => {
  it("should extract __typename fields from nested objects", () => {
    const targetValue = {
      user: {
        id: "1",
        name: "John",
        address: {
          city: "New York",
          __typename: "UserAddress",
        },
        contacts: [
          {
            name: "primary",
            email: [
              {
                type: "work",
                value: "john@example.com",
                __typename: "UserContactEmail",
              },
            ],
            __typename: "UserContact",
          },
        ],
        __typename: "User",
      },
    };

    const expectedOutput = {
      user: "User",
      "user.address": "UserAddress",
      "user.contacts": "UserContact",
      "user.contacts.email": "UserContactEmail",
    };

    const te = buildTypenameExtractor({
      targetValue,
      schemaSet,
    });

    expect(te.typenamesByPath).toEqual(expectedOutput);
  });

  it("should return null for non-object input", () => {
    const te = buildTypenameExtractor({
      targetValue: undefined,
      schemaSet,
    });

    expect(te.typenamesByPath).toEqual({});
  });

  it("should return an empty object for an empty input object", () => {
    const te = buildTypenameExtractor({
      targetValue: {},
      schemaSet,
    });

    expect(te.typenamesByPath).toEqual({});
  });

  it("should handle objects without __typename fields", () => {
    const input = {
      user: {
        id: "1",
        name: "John",
        address: {
          city: "New York",
        },
        contacts: [
          {
            email: "john@example.com",
          },
        ],
      },
    };

    const te = buildTypenameExtractor({
      targetValue: input,
      schemaSet,
    });

    expect(te.typenamesByPath).toEqual({});
  });
});

describe("resolveTypenameByPath", () => {
  const input = {
    user: {
      id: "1",
      name: "John",
      category: "ADMIN",
      address: {
        city: "New York",
        __typename: "UserAddress",
      },
      __typename: "User",
    },
  };

  it("should resolve types from simple path", () => {
    expect(
      buildTypenameExtractor({
        targetValue: input,
        schemaSet,
      }).resolveTypenameByPath("user"),
    ).toStrictEqual({
      id: { type: "Scalar", name: "ID" },
      name: { type: "Scalar", name: "String" },
      email: { type: "Scalar", name: "String" },
      category: {
        type: "Enum",
        name: "UserCategory",
        meta: { values: ["ADMIN", "USER"] },
      },
      address: { type: "Object", name: "UserAddress" },
    });
  });

  it("should resolve types from nested path", () => {
    expect(
      buildTypenameExtractor({
        targetValue: input,
        schemaSet,
      }).resolveTypenameByPath("user.address"),
    ).toStrictEqual({
      city: { type: "Scalar", name: "String" },
      street: { type: "Scalar", name: "String" },
      zip: { type: "Scalar", name: "String" },
    });
  });
});
