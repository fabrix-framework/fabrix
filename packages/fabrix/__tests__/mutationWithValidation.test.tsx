import { describe, expect, it } from "vitest";
import { FabrixComponent } from "@renderer";
import { faker } from "@faker-js/faker";
import { testWithUnmount } from "./supports/render";
import { findForm } from "./supports/utils";

describe("String", () => {
  it("minLength/maxLength", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.name", constraint: { minLength: 5, maxLength: 10 } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", faker.string.alpha(4));
        await form.submit();
        expect(form.getAlert("input.name")).toHaveTextContent(
          "must NOT have fewer than 5 characters",
        );

        await form.set("input.name", faker.string.alpha(5));
        await form.submit();
        expect(form.getAlert("input.name")).not.toBeInTheDocument();

        await form.set("input.name", faker.string.alpha(10));
        await form.submit();
        expect(form.getAlert("input.name")).not.toBeInTheDocument();

        await form.set("input.name", faker.string.alpha(11));
        await form.submit();
        expect(form.getAlert("input.name")).toHaveTextContent(
          "must NOT have more than 10 characters",
        );
      },
    );
  });

  it("pattern", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.name", constraint: { pattern: "^[a-z]+$" } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", "John Doe");
        await form.submit();
        expect(form.getAlert("input.name")).toHaveTextContent(
          'must match pattern "^[a-z]+$"',
        );

        await form.set("input.name", "johndoe");
        await form.submit();
        expect(form.getAlert("input.name")).not.toBeInTheDocument();
      },
    );
  });

  it("format (email)", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.email", constraint: { format: "email" } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.email", "john.doe");
        await form.submit();
        expect(form.getAlert("input.email")).toHaveTextContent(
          'must match format "email"',
        );

        await form.set("input.email", faker.internet.email());
        await form.submit();
        expect(form.getAlert("input.email")).not.toBeInTheDocument();
      },
    );
  });

  it("oneOf", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.name", constraint: { oneOf: ["EmployeeA", "EmployeeB"] } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", "EmployeeX");
        await form.submit();
        expect(form.getAlert("input.name")).toHaveTextContent(
          "must be equal to one of the allowed value",
        );

        await form.set("input.name", "EmployeeA");
        await form.submit();
        expect(form.getAlert("input.name")).not.toBeInTheDocument();
      },
    );
  });
});

describe("Int/Float", () => {
  it("min/max", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.age", constraint: { min: 20, max: 30 } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", "John Doe");
        await form.set("input.category", "ADMIN");

        await form.set("input.age", "19");
        await form.submit();
        expect(form.getAlert("input.age")).toHaveTextContent("must be >= 20");

        await form.set("input.age", "20");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();

        await form.set("input.age", "30");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();

        await form.set("input.age", "31");
        await form.submit();
        expect(form.getAlert("input.age")).toHaveTextContent("must be <= 30");
      },
    );
  });

  it("exclusive min/max", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.age", constraint: { exclusiveMin: 20, exclusiveMax: 30 } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", "John Doe");
        await form.set("input.category", "ADMIN");

        await form.set("input.age", "20");
        await form.submit();
        expect(form.getAlert("input.age")).toHaveTextContent("must be > 20");

        await form.set("input.age", "21");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();

        await form.set("input.age", "29");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();

        await form.set("input.age", "30");
        await form.submit();
        expect(form.getAlert("input.age")).toHaveTextContent("must be < 30");
      },
    );
  });

  it("multipleOf", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.age", constraint: { multipleOf: 5 } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", "John Doe");

        await form.set("input.age", "19");
        await form.submit();
        expect(form.getAlert("input.age")).toHaveTextContent(
          "must be multiple of 5",
        );

        await form.set("input.age", "20");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();
      },
    );
  });

  it("oneOf", async () => {
    await testWithUnmount(
      <FabrixComponent
        query={`
          mutation createUser($input: CreateUserInput!) {
            createUser(input: $input) @fabrixForm(input: [
              { field: "input.age", constraint: { oneOf: [20, 30] } }
            ]) {
              id
            }
          }
        `}
      />,
      async () => {
        const form = await findForm();
        await form.set("input.name", "John Doe");
        await form.set("input.category", "ADMIN");

        await form.set("input.age", "19");
        await form.submit();
        expect(form.getAlert("input.age")).toHaveTextContent(
          "must be equal to one of the allowed value",
        );

        await form.set("input.age", "20");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();

        await form.set("input.age", "30");
        await form.submit();
        expect(form.getAlert("input.age")).not.toBeInTheDocument();
      },
    );
  });
});
