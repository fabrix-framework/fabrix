declare module "*.graphql" {
  const Document: import("graphql").DocumentNode;
  export default Document;
}
