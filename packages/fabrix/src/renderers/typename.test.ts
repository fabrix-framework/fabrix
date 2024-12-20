import { describe, it, expect } from "vitest";
import { extractTypename } from "./typename";

describe("extractTypename", () => {
  it("should extract __typename fields from nested objects", () => {
    const input = {
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

    expect(extractTypename(input)).toEqual(expectedOutput);
  });

  it("should return null for non-object input", () => {
    expect(extractTypename(undefined)).toBeNull();
  });

  it("should return an empty object for an empty input object", () => {
    expect(extractTypename({})).toEqual({});
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

    expect(extractTypename(input)).toEqual({});
  });
});
