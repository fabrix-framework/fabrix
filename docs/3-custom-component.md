# Custom components

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
  custom: {
    unit: {
      myCustomField: {
        type: "field",
        component: MyCustomField,
      },
    }
  },
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

```graphql
query getCharacter($id: ID!) {
  getCharacter(id: $id) @fabrixView(input: [
    { field: "name", config: { label: "Name", componentType: { name: "myCustomField" } } }
    { field: "email", config: { label: "Email", componentType: { name: "myCustomField" } } }
  ]) {
    name
    email
  }
}
```
