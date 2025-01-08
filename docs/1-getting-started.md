# Getting started

Fabrix is designed to work with React applications, so you’ll need to set up a React app using create-react-app or a similar tool before getting started.

### Install

To start using fabrix, we have to install two dependent packages:

1. Core
2. Components

In this quick start, we will use fabrix with Chakra UI components.

```bash
npm install --save @fabrix-framework/fabrix @fabrix-framework/chakra-ui
```

### Add provider

Add `FabrixProvider` that configures fabrix in your app.

```tsx
import { FabrixProvider } from "@fabrix-framework/fabrix";
import { ChakraUIRegistry } from "@fabrix-framework/chakra-ui";

const Providers = (props: React.PropsWithChildren) => {
  return (
    <FabrixProvider
      url={"http://localhost:3000/graphql"}
      componentRegistry={ChakraUIRegistry}
    >
      {props.children}
    </FabrixProvider>
  )
}
```

The `url` prop specifies the endpoint of your GraphQL server. This is the URL where Fabrix will send queries and mutations to interact with your backend. It should point to your GraphQL server’s endpoint. In this example, `http://localhost:3000/graphql` is the URL where your GraphQL server is running. Replace this with the appropriate URL for your server.

The `componentRegistry` prop defines which components Fabrix should use to render different fields and data types. It acts as a mapping between GraphQL types and React components. Fabrix includes a default component registry, such as Chakra UI components, but you can also provide your own custom registry. See [Custom components](#custom-components) for more detail.

### Render views

Give your own query to `query` prop to render components with fabrix.

```tsx
import { FabrixComponent } from "@fabrix-framework/fabrix"

const Characters = () => {
  return (
    <FabrixComponent
      query={`
        query characters {
          characters {
            collection {
              id
              name
              status
            }
          }
        }
      `}
    />
  )
}
```

Fabrix can also automatically generate forms from GraphQL mutations. The fields in the form are derived from the input types specified in the mutation variables. This allows you to quickly create and render forms based on your GraphQL schema without manually defining each form field.

When you provide a mutation to Fabrix, it inspects the input types of the mutation to determine the fields that should be included in the form. 

Here’s an example of how you can use Fabrix to render a form from a mutation:

```tsx
import { FabrixComponent } from "@fabrix-framework/fabrix";

const CreateCharacter = () => {
  return (
    <FabrixComponent
      mutation={`
        mutation createCharacter($input: CreateCharacterInput!) {
          createCharacter(input: $input) {
            id
          }
        }
      `}
    />
  );
}
```
