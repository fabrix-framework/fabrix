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
  it("should render only the form when the directive is given", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm {
              id
            }
          }
        `}
      />,
      () => {
        expect(
          screen.queryByRole("region", {
            name: /fabrix-input/,
          }),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole("region", {
            name: /fabrix-output/,
          }),
        ).not.toBeInTheDocument();
      },
    );
  });

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

describe("children props", () => {
  it("should render the form with children props", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
            }
          }
        `}
      >
        {({ getInput }) =>
          getInput({}, ({ Field, getAction }) => (
            <div role="form">
              <Field name="input.name" extraProps={{ label: "Name" }} />
              <Field name="input.category" extraProps={{ label: "Category" }} />
              <button {...getAction()}>Send</button>
            </div>
          ))
        }
      </FabrixComponent>,
      async () => {
        const form = await screen.findByRole("form");

        const button = await within(form).findByRole("button");
        expect(within(button).getByText("Send")).toBeInTheDocument();

        const formFields = await within(form).findAllByRole("group");
        expect(
          await within(formFields[0]).findByLabelText("Name"),
        ).toBeInTheDocument();
        expect(
          await within(formFields[1]).findByLabelText("Category"),
        ).toBeInTheDocument();
      },
    );
  });
});
