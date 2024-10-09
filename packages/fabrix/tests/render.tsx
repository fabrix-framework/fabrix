import { FabrixProvider } from "@provider";
import { render } from "@testing-library/react";
import { testingComponents } from "./components";

export const testWithUnmount = async (
  ui: React.ReactNode,
  test: () => Promise<void> | void,
) => {
  const r = render(ui, {
    wrapper: ({ children }) => (
      <FabrixProvider
        url="http://localhost:1234"
        componentRegistry={testingComponents}
      >
        {children}
      </FabrixProvider>
    ),
  });

  await test();

  // Not knowing why this is required, but DOM between tests are unexpectedly shared and not cleaned up.
  // So we need to unmount the test component to avoid unwanted test results.
  // Ref: https://github.com/testing-library/react-testing-library/issues/716
  r.unmount();
};
