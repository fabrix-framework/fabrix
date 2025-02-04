# @fabrix-framework/fabrix

## 0.7.0

### Minor Changes

- [#166](https://github.com/fabrix-framework/fabrix/pull/166) [`d433fe0`](https://github.com/fabrix-framework/fabrix/commit/d433fe055915eea357efc1df4acfd277b1e78ec4) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Support constraints for nested object field in fabrixForm directive API

- [#155](https://github.com/fabrix-framework/fabrix/pull/155) [`b577afa`](https://github.com/fabrix-framework/fabrix/commit/b577afae84a5704ba85d28105f90c68e0e1c15f8) Thanks [@IzumiSy](https://github.com/IzumiSy)! - This update contains the breaking changes specifically on functions that the children prop in `FabrixComponent` passes down to bring more flexibility in rendering the view.

  See [#168](https://github.com/fabrix-framework/fabrix/issues/168) for more about the motivation about this change.

  ## Input and Output

  The newly introduced functions in the children prop is `getInput` and `getOutput`.

  - `getInput` is a function that plays a role as a form renderer, and also an accessor of the form context and form field control. Input fields are inferred from variable definitions in the corresponding GraphQL operation.
  - `getOutput` is a function that works as a result renderer (the behaviour of it depends on the component registered in the component registry), and also a direct accessor of the query data. Output fields are inferred from selected fields in the corresponding GraphQL operation.

  Here is the example implementation that renders the form to get the search condition for `Query` operation alongside the result component like tables.

  ```tsx
  <FabrixComponent
    query={gql`
      query getTodos($input: GetTodoInput!) {
        getTodos(input: $input) {
          edges {
            node {
              name
              priority
            }
          }
        }
      }
    `}
  >
    {({ getInput, getOutput }) => (
      <>
        {/*
         * `getInput` renders the all form fields inferred from the variables
         * The rendered view by `getInput` without render props also has the button to execute the query.
         */}
        {getInput()}

        {/*
         * `getOuput` renders the result of the mutation
         * This example assumes that `getTodos` is rendered as a table component.
         */}
        {getOutput("getTodos")}
      </>
    )}
  </FabrixComponent>
  ```

  The important point to mention is that `getOutput` and `getInput` work in the same way both for `Query` and `Mutation` by this update.

  ### `data` accessor

  With this update, `data` accessor is accessible through `getOuput` function, since the data is tied from the query result (output).

  ```tsx
  <FabrixComponent
    query={gql`
      query getTodo {
        getTodo {
          name
          priority
        }
      }
    `}
  >
    {({ getOutput }) =>
      getOutput("getTodo", ({ data }) => <div>Todo name: {data.name}</div>)
    }
  </FabrixComponent>
  ```

  ## More customizable, layoutable form

  Here is the complex example to create an update form to show the customizability and layoutability.

  ```tsx
  <FabrixComponent
    query={gql`
      mutation updateTodo($id: ID!, $input: CreateTodoInput!) {
        updateTodo(id: $id, input: $input) {
          id
        }
      }
    `}
  >
    {({ getInput }) =>
      /*
       * `getInput` is a function to render form view which can acess functions to build forms.
       * `Field` and `getAction` are the key functions (see their explanation below)
       */
      getInput({
        /*
         * If the form is the one to update resource, set `defaultValues` here to prefill the form fields.
         * The data structure should be matched with the variables of query/mutation.
         */
        defaultValues: {
          id: "user-id",
          input: {
            name: "John Doe"
          }
        }
      }, ({ Field, getAction }) => (
        {/*
          * `getAction` is expcted to be passed as an descructive props to `form` element.
          * It is an object that contains `onSubmit` function as a member that kicks off the query execution.
          */}
        <form {...getAction()}>
          {/*
            * `Field` is a React component that renders the form field  that autotimacally deciding
            * the corresponding component according to GraphQL type for the path specified in the `name` prop.
            *
            * `extraProps` is the prop to carry information to the form field.
            * In this example, I assume the component that is registered in the component registry
            * as the form field handles `label` to show it as a text content in the `label` element.
            *
            * The props for the `extraProps` should have more variety (e.g., `disabled`, `placeholder`, ...),
            * but I will work on adding them in other PRs later on.
            */}
          <HStack>
            <Field name="input.name" extraProps={{ label: "Task Name" }} />
            <Field name="input.priority" extraProps={{ label: "Task Priority" }} />
          </HStack>
          <Button type="submit">Add</Button>
        </form>
      ))
    }
  </FabrixComponent>
  ```

  Additionally, for more page-by-page customization for the form, `getInput` functions offers more functions in its render props, mostly powered by react-hook-form that fabrix internal uses.

  ### Field-level handler

  In the case that the field component automatially decided by GraphQL type does not fit the requirement in the form, `getInput` function provides the another customizable point at the field level in the form.

  `getField` function returns the value of `UseFormRegisterReturn` in react-hook-form. Users would be able to use the another input component on the spot with this.

  ```tsx
  <FabrixComponent query={`/* ... */`}>
    {({ getInput }) =>
      getInput({}, ({ Field, getAction, getField }) => {
        <form {...getAction()}>
          <Field name="input.name" />
          <Field name="input.priority" />
          <input {...getField("input.email")} type="text" />
        </form>;
      })
    }
  </FabrixComponent>
  ```

  ### Form context

  The render props of `getInput` function also passes down `formContext` that is the react-hook-form context that the form rendered by `getInput` internally maintains.

  This helps users create the flexible form-wide funcionality as they want by lerveraging the functionality of react-hook-form like inter-field interactibity.

  ```tsx
  import { UseFormReturn } from "react-hook-form";

  const Page = () => (
    <FabrixComponent query={`/* ... */`}>
      {({ getInput }) =>
        getInput({}, ({ getAction, formContext }) => {
          <form {...getAction()}>
            <WatchingField formContext={formContext} />
          </form>;
        })
      }
    </FabrixComponent>
  );

  const WatchingField = (props: { formContext: UseFormReturn }) => {
    /*
     * Watches the value on the form field using `watch` method in the form context of react-hook-form
     */
    const status = formContext.watch("input.priority");
  };
  ```

  ## Backward incompatibility

  The previous behaviour of `FabrixComponent` is that only the component for the result was rendered in `Query` and only the form for `Mutation` on the contrary.
  However, from this relelase, `FabrixComponent` will render both the form and the result of the component regardless of operation type.

  If you would like to maintain the previous behaviour, use directives to guide the query render only the specific component that you want.

  ```tsx
  /*
   * `@fabrixForm` directive does not
   */
  <FabrixComponent
    query={gql`
      mutation updateTodo($id: ID!, $input: CreateTodoInput!) {
        updateTodo(id: $id, input: $input) @fabrixForm {
          id
        }
      }
    `}
  />
  ```

  `fabrixView` also works for `Query` operation in the same way.

### Patch Changes

- [#176](https://github.com/fabrix-framework/fabrix/pull/176) [`e77f632`](https://github.com/fabrix-framework/fabrix/commit/e77f6326abe9b358870bf4a982c01cb6be3fe0bd) Thanks [@toiroakr](https://github.com/toiroakr)! - Use turbo cache on CI

- [#177](https://github.com/fabrix-framework/fabrix/pull/177) [`9450a34`](https://github.com/fabrix-framework/fabrix/commit/9450a34231b7ac4b88be88f84f9357d969887e67) Thanks [@toiroakr](https://github.com/toiroakr)! - Add path to GitHub Actions' trigger.

## 0.6.0

### Minor Changes

- [#159](https://github.com/fabrix-framework/fabrix/pull/159) [`2434e76`](https://github.com/fabrix-framework/fabrix/commit/2434e760b2be6c51b46d3d70cb675ad3007097e5) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Update tsconfig.json

## 0.5.0

### Minor Changes

- [#144](https://github.com/fabrix-framework/fabrix/pull/144) [`c19ff4e`](https://github.com/fabrix-framework/fabrix/commit/c19ff4eff372b1b74f07859af663dac07e0b929c) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Add provenance

- [#153](https://github.com/fabrix-framework/fabrix/pull/153) [`7c104b0`](https://github.com/fabrix-framework/fabrix/commit/7c104b0ccd4850585f08847ae60ea8b36ffc62cd) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Add `TypedDocumentNode` support: now when the `TypedDocumentNode` query is given, `data` and `variables` are typed.

  Also, `getComponent` has the first argument that is typed to help users select the component associated to the query.

- [#152](https://github.com/fabrix-framework/fabrix/pull/152) [`d474f8c`](https://github.com/fabrix-framework/fabrix/commit/d474f8cd9ab684167b1b2efec5b494752b951bee) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Remove `getOperation` function from children props in FabrixComponent.

  Now `query` prop in `FabrixComponent` supports only a single query to get it future compatible with TypedDocumentNode.

## 0.4.0

### Minor Changes

- [#143](https://github.com/fabrix-framework/fabrix/pull/143) [`4796a44`](https://github.com/fabrix-framework/fabrix/commit/4796a4427c768f4a9b414d99d3161645026c76d4) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Update meta fields in package.json

## 0.3.0

### Minor Changes

- [#141](https://github.com/fabrix-framework/fabrix/pull/141) [`304d58d`](https://github.com/fabrix-framework/fabrix/commit/304d58d284d7ab4cbca5a6258590b28f2f4882c3) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Fix build files

- [#134](https://github.com/fabrix-framework/fabrix/pull/134) [`2f2e013`](https://github.com/fabrix-framework/fabrix/commit/2f2e013a0c77957ed67fc415cdda3c7c3ab16889) Thanks [@IzumiSy](https://github.com/IzumiSy)! - Update README to have links to the external docs

## 0.2.0

### Minor Changes

- [#128](https://github.com/fabrix-framework/fabrix/pull/128) [`86ab46f`](https://github.com/fabrix-framework/fabrix/commit/86ab46f8ed936be8b75aa28dbbfb7d2c835bc5b4) Thanks [@IzumiSy](https://github.com/IzumiSy)!
  - Some minor updates
  - Added React v19 support
