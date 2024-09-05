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
import {
  buildSchemaSet,
  BuildFabrixContextProps,
  emptySchema,
  SchemaSet,
  FabrixContext,
} from "./context";

type FabrixProviderProps = {
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
  const [schemaSet, setSchemaSet] = useState<SchemaSet>({
    serverSchema: emptySchema,
  });

  useEffect(() => {
    buildSchemaSet(props)
      .then(setSchemaSet)
      .catch((e: Error) => {
        throw new Error(`Failed to build Fabrix context (${e.message})`);
      });
  }, [setSchemaSet, props]);

  return (
    <FabrixContext.Provider
      value={{
        schemaSet,
        componentRegistry: props.componentRegistry,
      }}
    >
      {props.children}
    </FabrixContext.Provider>
  );
};
