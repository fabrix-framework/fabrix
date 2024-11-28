import { buildRootDocument } from "@visitor";
import { gql } from "urql";
import { describe, expect, test } from "vitest";

describe("buildRootDocument", () => {
  test("should build root document", () => {
    const documents = buildRootDocument(gql`
      query getUser {
        user {
          id
          name
        }
      }
    `);

    expect(documents.length).toBe(1);
    expect(
      documents[0].fields
        .getChildrenWithAncestors("user")
        .unwrap()
        .map((f) => f.getName()),
    ).toStrictEqual(["id", "name"]);
  });

  test("should build root document with multiple operations", () => {
    const documents = buildRootDocument(gql`
      query getUser {
        user {
          userName
        }
      }

      mutation getRole {
        role {
          roleName
        }
      }
    `);

    expect(documents.length).toBe(2);
    expect(
      documents[0].fields
        .getChildrenWithAncestors("user")
        .unwrap()
        .map((f) => f.getName()),
    ).toStrictEqual(["userName"]);
    expect(
      documents[1].fields
        .getChildrenWithAncestors("role")
        .unwrap()
        .map((f) => f.getName()),
    ).toStrictEqual(["roleName"]);
  });

  test("should build root document with nested fields", () => {
    const documents = buildRootDocument(gql`
      query getMovie {
        movie {
          producer {
            name
          }
          director {
            name
          }
        }
      }
    `);

    expect(documents.length).toBe(1);
    expect(
      documents[0].fields
        .getChildrenWithAncestors("movie")
        .unwrap()
        .map((f) => f.value.path.value.join(".")),
    ).toStrictEqual([
      "movie.producer",
      "movie.producer.name",
      "movie.director",
      "movie.director.name",
    ]);
  });

  test("should build root document with a fragment spread", () => {
    const documents = buildRootDocument(gql`
      query getUser {
        user {
          id
          name
          ...userProfileImage
        }
      }
    `);

    expect(documents.length).toBe(1);
    expect(
      documents[0].fields
        .getChildrenWithAncestors("user")
        .unwrap()
        .map((f) => f.getName()),
    ).toStrictEqual(["id", "name", "userProfileImage"]);
  });
});
