# Fabrix directives

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
