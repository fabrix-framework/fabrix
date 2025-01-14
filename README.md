![cover](https://github.com/fabrix-framework/.github/blob/main/assets/cover.png)
  
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/fabrix-framework/fabrix/ci-packages.yaml?branch=main)](https://github.com/fabrix-framework/fabrix/actions)
[![GitHub](https://img.shields.io/github/license/fabrix-framework/fabrix)](https://github.com/fabrix-framework/fabrix/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@fabrix-framework/fabrix?logo=nodedotjs)](https://www.npmjs.com/package/@fabrix-framework/fabrix)

<hr />

Fabrix is a framework for building React applications that are backed by GraphQL backend. 

# Features

* **Snappy DX** :heart: - Finally, all you need to do is just writing GraphQL! Free from repetitive tasks to ship your frontend to customers.
* **Just works with React app** :rocket: - Fabrix can work with any existing React app, and can be used with any GraphQL schema. See [Component API](https://fabrix-framework.github.io/docs/guides/component/) for more information.
* **Bring your own components** 🛠️ - Fabrix is designed to be agnostic to the components you use. You can use any component library, or [even build your own](https://fabrix-framework.github.io/docs/guides/component-registry/). We already have several component libraries that you can use out of the box.

# Quick start

See the instruction at [our documentation](https://fabrix-framework.github.io/docs/) to use fabrix in your React app

## Examples

We have some [example apps](./examples) in repo.

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
