# fabrix

![cover](./assets/cover.png)

Fabrix is a framework for building React applications that are backed by GraphQL backend. With fabrix, React components are generated from queries and mutations and automatically rendered with the data fetched from the GraphQL server.

Consider the component in the Star Wars application that displays information of a character:

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

## Why fabrix? 

At [Tailor](https://www.tailor.tech/), we frequently build frontend applications with numerous screens and heavy CRUD (Create, Read, Update, Delete) operations, particularly in admin panels and ERP systems.

While generating type definitions and hooks from GraphQL is a common practice in React applications, this approach is often applied on a component-by-component basis. For applications requiring fine-tuned styling and high flexibility, this level of detail is necessary. However, in admin panels and ERP systems—where functionality and data management are prioritized over intricate styling—this granularity often becomes a burden.

Fabrix solves this problem by automating the rendering of React components from GraphQL queries and schemas, significantly streamlining the development of complex, data-driven applications.

# Quick start

> [!WARNING]
> Fabrix is still in the **early stage of development**.
> The API may change without any notice.
>
> We are still actively developing the features. Tell us your idea or feedback on [discussions](https://github.com/fabrix-framework/fabrix/discussions).

See the instruction at [the quick start](./packages/fabrix/README.md#quick-start) to use fabrix in your React app, or [online interactive editor](https://fabrix-framework.github.io/editor/) is available to see how fabrix works out without any setups.

# Development

## Packages

| package                          | description                     | link                                        |
|----------------------------------|---------------------------------|---------------------------------------------|
| @fabrix-framework/fabrix         | Core package                    | [Docs](./packages/fabrix/README.md)         |
| @fabrix-framework/graphql-config | GraphQL LSP support             | [Docs](./packages/graphql-config/README.md) |
| @fabrix-framework/chakra-ui      | Chakra UI components for fabrix | [Docs](./packages/chakra-ui/README.md)      |

## Setup 

Install required dependencies

```bash
pnpm install
```

## Build

```bash
pnpm build
```

# Contributing

Refer to our [contribution guidelines](./CONTRIBUTING.md).

# License

Fabrix is open source software licensed as MIT
