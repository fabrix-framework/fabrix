import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { FabrixComponent } from "@renderer";
import { testWithUnmount } from "./supports/render";

describe("mutation", () => {
  it("should render the form", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await screen.findByRole("form");
        expect(form).toBeInTheDocument();

        const inputs = await within(form).findAllByRole("textbox");
        expect(inputs.length).toBe(5);
      },
    );
  });
});

describe("directive", () => {
  it("should render the form with customized labels", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "id", config: { hidden: true } },
              { field: "name", config: { label: "UserName" } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await screen.findByRole("form");
        expect(form).toBeInTheDocument();

        expect(within(form).queryByLabelText("id")).not.toBeInTheDocument();
        expect(within(form).getByLabelText("UserName")).toBeInTheDocument();
      },
    );
  });
});
