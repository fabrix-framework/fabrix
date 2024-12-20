import { describe, it, expect } from "vitest";
import { mockSchema } from "../../__tests__/mocks/handlers";
import { buildTypenameExtractor } from "./typename";

describe("extractTypename", () => {
  const schemaSet = {
    serverSchema: mockSchema,
  };

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

  describe("resolveTypenameByPath", () => {
    const input = {
      user: {
        id: "1",
        name: "John",
        address: {
          city: "New York",
          __typename: "UserAddress",
        },
        __typename: "User",
      },
    };

    it.each([
      ["user", ["id", "name", "email", "address"]],
      ["user.address", ["city", "street", "zip"]],
    ])("should resolve typenames by path (%s)", (path, keys) => {
      const te = buildTypenameExtractor({
        targetValue: input,
        schemaSet,
      });

      const userType = te.resolveTypenameByPath(path);
      expect(Object.keys(userType ?? {})).toEqual(expect.arrayContaining(keys));
    });
  });
});
