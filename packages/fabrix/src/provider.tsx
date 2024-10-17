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
  buildSchemaSet,
  BuildFabrixContextProps,
  FabrixContext,
  SchemaLoader,
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
  const [schemaSetStatus, setSchemaSetStatus] = useState<SchemaLoader>({
    status: "loading",
  });

  useEffect(() => {
    buildSchemaSet(props)
      .then((value) => {
        setSchemaSetStatus({
          status: "loaded",
          schemaSet: value,
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
