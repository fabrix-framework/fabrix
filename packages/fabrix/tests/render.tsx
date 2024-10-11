import { FabrixProvider } from "@provider";
import {
  render,
  waitForElementToBeRemoved,
  screen,
} from "@testing-library/react";
import { testingComponents } from "./components";

export const testWithUnmount = async (
  ui: React.ReactNode,
  test: () => Promise<void> | void,
) => {
  const component = render(ui, {
    wrapper: ({ children }) => (
      <FabrixProvider
        url="http://localhost:1234"
        componentRegistry={testingComponents}
      >
        {children}
      </FabrixProvider>
    ),
  });

  await waitForElementToBeRemoved(() => screen.queryAllByRole("status"));

  try {
    await test();
  } finally {
    // Not knowing why this is required, but DOM between tests are unexpectedly shared and not cleaned up.
    // So we need to unmount the test component to avoid unwanted test results.
    // Ref: https://github.com/testing-library/react-testing-library/issues/716
    component.unmount();
  }
};
