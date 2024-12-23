import { FabrixComponent } from "@renderer";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { testWithUnmount } from "./supports/render";
import { users } from "./mocks/data";

describe("query", () => {
  it("should render the fields", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          query {
            firstUser {
              id
              name
              email
              address {
                city
                street
                zip   
              }
            }
          }
        `}
      />,
      async () => {
        const fields = await screen.findAllByRole("region");
        const textContents = fields.map((field) => field.textContent);

        const user = users[0];
        expect(textContents).toEqual([
          `id:${user.id}`,
          `name:${user.name}`,
          `email:${user.email}`,
          `address.city:${user.address.city}`,
          `address.street:${user.address.street}`,
          `address.zip:${user.address.zip}`,
        ]);
      },
    );
  });
});
