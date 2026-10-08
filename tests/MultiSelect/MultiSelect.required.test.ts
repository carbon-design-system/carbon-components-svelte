import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import MultiSelect from "./MultiSelect.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
];

describe("MultiSelect required", () => {
  it.each([false, true])(
    "blocks form submission until an item is selected (filterable: %s)",
    async (filterable) => {
      render(MultiSelect, { props: { items, filterable, required: true } });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-required", "true");
      expect(getForm().checkValidity()).toBe(false);

      await user.click(combobox);
      await user.click(screen.getByRole("option", { name: "Email" }));
      expect(getForm().checkValidity()).toBe(true);

      await user.click(screen.getByRole("option", { name: "Email" }));
      expect(getForm().checkValidity()).toBe(false);
    },
  );

  it("is not required by default", () => {
    render(MultiSelect, { props: { items } });

    expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-required");
    expect(getForm().checkValidity()).toBe(true);
  });
});
