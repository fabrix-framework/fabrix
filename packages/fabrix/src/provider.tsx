import { useEffect, useMemo, useState } from "react";
import {
  Exchange,
  Client as UrqlClient,
  Provider as UrqlProvider,
  fetchExchange,
  cacheExchange,
} from "urql";
import { removeDirectivesExchange } from "@exchanges/removeDirectives";
import { addTypenameFieldExchange } from "@exchanges/addTypename";
import { removeTypenameFromVariableExchange } from "@exchanges/removeTypenameFromVariable";
import {
  useSchemaSetBuilder,
  BuildFabrixContextProps,
  FabrixContext,
  SchemaLoader,
} from "./context";

type FabrixProviderProps = {
  /**
   * The URL of the GraphQL server to connect to.
   *
   * This prop will be used to fetch the schema of the server if the `serverSchema` is not provided.
   */
  url: string;

  /**
   * A list of urql exchanges to prepend to the default exchanges.
   */
  prependExchanges?: Array<Exchange>;
} & BuildFabrixContextProps;

export const FabrixProvider = (
  props: React.PropsWithChildren<FabrixProviderProps>,
) => {
  const client = useMemo(
    () =>
      new UrqlClient({
        url: props.url,
        exchanges: [
          cacheExchange,
          ...(props.prependExchanges ?? []),
          removeDirectivesExchange(["fabrixView", "fabrixList", "fabrixForm"]),
          addTypenameFieldExchange,
          removeTypenameFromVariableExchange,
          fetchExchange,
        ],
      }),
    [props.url, props.prependExchanges],
  );

  return (
    <UrqlProvider value={client}>
      <FabrixContextProvider {...props}>{props.children}</FabrixContextProvider>
    </UrqlProvider>
  );
};

const FabrixContextProvider = (
  props: React.PropsWithChildren<BuildFabrixContextProps>,
) => {
  const builder = useSchemaSetBuilder(props);
  const [schemaSetStatus, setSchemaSetStatus] = useState<SchemaLoader>({
    status: "loading",
  });

  useEffect(() => {
    builder
      .build()
      .then((schemaSet) => {
        setSchemaSetStatus({
          status: "loaded",
          schemaSet,
        });
      })
      .catch((e: Error) => {
        throw new Error(`Failed to build Fabrix context (${e.message})`);
      });
  }, [setSchemaSetStatus, props]);

  return (
    <FabrixContext.Provider
      value={{
        schemaLoader: schemaSetStatus,
        componentRegistry: props.componentRegistry,
      }}
    >
      {props.children}
    </FabrixContext.Provider>
  );
};
