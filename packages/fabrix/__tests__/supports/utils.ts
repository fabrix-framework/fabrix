import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export const findForm = async () => {
  const form = await screen.findByRole("form");
  const user = userEvent.setup();

  return {
    element: within(form),
    set: async (label: string, value: string) => {
      const input = within(form).getByLabelText(label);
      await user.clear(input);
      await user.type(input, value);
    },
    submit: async () => {
      const submit = within(form).getByRole("button");
      await user.click(submit);
    },
    getAlert: (label: string) => {
      const field = within(form).getByLabelText(`field:${label}`);
      return within(field).queryByRole("alert");
    },
  };
};
