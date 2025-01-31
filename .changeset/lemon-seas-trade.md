---
"@fabrix-framework/fabrix": minor
---

More flexibility to render the view within `FabrixComponent`.

Now, you can use JSX expressions to place form components using the functions passed down through the children props.

## Query with forms 

Before this release, fabrix does not have any way to render forms for `Query` operation, but from this relelase, `Query` operation also is able to render the form along with the result.

This is useful in the case like the view that has the form to get the search parameters for the query.

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
         */}
       {getOutput("getTodos")}
     </>
  )}
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
      </form>
    }) 
  }
</FabrixComponent>
```

### Form context

The render props of `getInput` function also passes down `formContext` that is the react-hook-form context that the form rendered by `getInput` internally maintains.

This helps users create the flexible form-wide funcionality as they want by lerveraging the functionality of react-hook-form like inter-field interactibity.

```tsx
import { UseFormReturn } from "react-hook-form";

const Page = () =>
  <FabrixComponent query={`/* ... */`}>
    {({ getInput }) =>
      getInput({}, ({ getAction, formContext }) => {
        <form {...getAction()}>
          <WatchingField formContext={formContext} />
        </form>
      }) 
    }
  </FabrixComponent>

const WatchingField = (props: {
  formContext: UseFormReturn,
}) => {
  /*
   * Watches the value on the form field using `watch` method in the form context of react-hook-form
   */
  const status = formContext.watch("input.priority");
}
```

## Backward compatibility

TBW
