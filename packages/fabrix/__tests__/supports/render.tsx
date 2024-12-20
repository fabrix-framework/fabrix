import { FabrixProvider } from "@provider";
import {
  render,
  waitForElementToBeRemoved,
  screen,
} from "@testing-library/react";
import { ComponentRegistry } from "@registry";
import { testingComponents } from "./components";

export const testWithUnmount = async (
  ui: React.ReactNode,
  test: () => Promise<void> | void,
  options?: {
    /**
     * Custom components to be used in the test.
     */
    components?: ComponentRegistry;

    /**
     * If true, the loader will not be waited for removal.
     */
    noLoader?: boolean;
  },
) => {
  const components = options?.components
    ? testingComponents.merge(options.components)
    : testingComponents;

  const component = render(ui, {
    wrapper: ({ children }) => (
      <FabrixProvider
        url="http://localhost:1234"
        componentRegistry={components}
      >
        {children}
      </FabrixProvider>
    ),
  });

  if (!options?.noLoader) {
    await waitForElementToBeRemoved(() => screen.queryAllByRole("status"));
  }

  try {
    await test();
  } finally {
    // Not knowing why this is required, but DOM between tests are unexpectedly shared and not cleaned up.
    // So we need to unmount the test component to avoid unwanted test results.
    // Ref: https://github.com/testing-library/react-testing-library/issues/716
    component.unmount();
  }
};
