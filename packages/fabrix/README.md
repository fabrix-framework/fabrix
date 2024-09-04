![cover](../../assets/cover.png)

# fabrix <!-- omit in toc -->

Fabrix is a powerful framework that harnesses the capabilities of GraphQL to automatically generate UI components directly from your schema, accelerating your development process and reducing boilerplate.

## Table of Contents <!-- omit in toc -->

- [Concept](#concept)
  - [What is fabrix?](#what-is-fabrix)
  - [Why fabrix?](#why-fabrix)
- [Quick Start](#quick-start)
  - [Install](#install)
  - [Add provider](#add-provider)
  - [Render views](#render-views)
- [Directives](#directives)
  - [`fabrixView`](#fabrixview)
  - [`fabrixForm`](#fabrixform)
- [Custom components](#custom-components)
  - [Component Registry](#component-registry)
    - [`ComponentRegistry` Interface](#componentregistry-interface)
  - [Using custom Components](#using-custom-components)

## Concept

### What is fabrix?

Fabrix is a framework for build the React applications that are backed by GraphQL backend. In fabrix, React components are generated from queries and mutations, and automatically fetches data required to be rendered.

Consider the component in Starwars application that displays information of a character:

```tsx
const Character = (id: string) => 
  <FabrixComponent 
    query={`
      query getCharacter($id: ID!) {
        character(id: $id) {
          name
          status
          profileImage
        }
      } 
    `}
    variables={{ id }}
  />
```

According to the query above, fabrix renders components.

### Why fabrix? 

At Tailor, we frequently build frontend applications with numerous screens and heavy CRUD (Create, Read, Update, Delete) operations, particularly in admin panels and ERP systems.

While generating type definitions and hooks from GraphQL is a common practice in React applications, this approach is often applied on a component-by-component basis. For applications requiring fine-tuned styling and high flexibility, this level of detail is necessary. However, in admin panels and ERP systems—where functionality and data management are prioritized over intricate styling—this granularity often becomes a burden.

Fabrix solves this problem by automating the rendering of React components from GraphQL queries and schemas, significantly streamlining the development of complex, data-driven applications.

## Quick Start

Fabrix is designed to work with React applications, so you’ll need to set up a React app using create-react-app or a similar tool before getting started.

### Install

To start using fabrix, we have to install two depepdent packages:

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

## Directives

Fabrix provides powerful GraphQL directives that allow you to customize the rendering of fields in views and forms directly from your schema. 

This eliminates the need to manually configure components in your React codebase, streamlining the development process.

### `fabrixView`

The `@fabrixView` directive enables you to define how specific fields in your GraphQL schema should be rendered in a view. You can customize various aspects of the field’s appearance, such as:

- **Grid Layout**: Specify the number of grid columns (`gridCol`) the field should occupy, with a maximum of 12.
- **Indexing**: Determine the field's order in the view with the `index` property.
- **Labeling**: Assign a custom label to the field using the `label` property.
- **Visibility**: Control the visibility of the field with the `hidden` property.
- **Custom Components**: Define the component type to render the field using the `componentType` property, including any props for the component.

These directives are placed at the root selection of an operation query.

Example usage:

```graphql
query getCharacter($id: ID!) {
  getCharacter(id: $id) @fabrixView(input: [
    { field: "name", config: { label: "Full Name", gridCol: 6 } },
    { field: "status", config: { hidden: true } }
  ]) {
    name
    status
  }
}
```

### `fabrixForm`

The `@fabrixForm` directive is used to configure how fields should be rendered in forms. It provides similar customization options as `@fabrixView`, with additional form-specific properties like:

- **Placeholder**: Set placeholder text for the input field with the `placeholder` property.
- **Default Value**: Define a default value for the field using the `defaultValue` property, which will be automatically converted to the appropriate type.

These directives are placed at the root selection of an operation query.

Example usage:

```graphql
mutation createCharacter($input: CreateCharacterInput!) {
  createCharacter(input: $input) @fabrixForm(input: [
    { field: "name", config: { placeholder: "Enter your full name", gridCol: 6 } },
    { field: "status", config: { defaultValue: "user@example.com", gridCol: 6 } }
  ]) {
    id
  }
}
```

## Custom components

Fabrix allows you to customize how different types of data are rendered by providing a `componentRegistry` prop in `FabrixProvider`. This prop enables you to define which React components should be used for various GraphQL types and fields, giving you the flexibility to tailor the UI components to fit your application’s needs.

### Component Registry

The `componentRegistry` prop is used to specify a set of components that Fabrix will use to render data. This prop can be an instance of the `ComponentRegistry` class, which supports both default and custom components.

#### `ComponentRegistry` Interface

The `ComponentRegistry` supports two types of components:

1. **Default Components**: These are predefined components for common use cases such as fields, forms, and tables. You can provide default components that Fabrix will use if no custom components are specified.

2. **Custom Components**: These are user-defined components that you can register for specific GraphQL types. You can create a `ComponentRegistry` with custom components that match the types and purposes of your schema fields.

Here’s how you can define and use a custom component registry:

```tsx
import { ComponentRegistry } from "@fabrix-framework/fabrix";
import { defaultComponents } from "@fabrix-framework/chakra-ui";
import MyCustomField from "./components/MyCustomField";
import MyCustomForm from "./components/MyCustomForm";

const yourCustomRegistry = new ComponentRegistry({
  default: defaultComponents,
  custom: [
    {
      type: "field",
      component: MyCustomField,
    },
  ],
});

export const Providers = (props: React.PropsWithChildren) =>
  <FabrixProvider
    url="http://localhost:3000/graphql"
    componentRegistry={yourCustomRegistry}
  >
    {props.children}
  </FabrixProvider>
```

### Using custom Components
You can use the `fabrixView` and `fabrixForm` directives to specify custom components for rendering fields and forms. 

The directives allow you to define how each field in a query or mutation should be displayed. The `name` field in the `componentType` configuration should match the name of the component provided in the `componentRegistry`.

```gql
query getCharacter($id: ID!) {
  getCharacter(id: $id) @fabrixView(input: [
    { field: "name", config: { label: "Name", componentType: { name: "MyCustomField" } } }
    { field: "email", config: { label: "Email", componentType: { name: "MyCustomField" } } }
  ]) {
    name
    email
  }
}
```

# Contributing

Refer to our [contribution guidelines](./CONTRIBUTING.md).

# License

Fabrix is open source software licensed as MIT
