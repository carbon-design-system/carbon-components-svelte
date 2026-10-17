import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import MultiSelect from "./MultiSelect.form.test.svelte";
import MultiSelectFormAttribute from "./MultiSelect.formAttribute.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
];

/** Shared `required` behavior is in tests/ListBox/family/required.test.ts. */
describe("MultiSelect required", () => {
  it.each([false, true])(
    "blocks form submission again once the last item is deselected (filterable: %s)",
    async (filterable) => {
      render(MultiSelect, { props: { items, filterable, required: true } });

      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByRole("option", { name: "Email" }));
      expect(getForm().checkValidity()).toBe(true);

      await user.click(screen.getByRole("option", { name: "Email" }));
      expect(getForm().checkValidity()).toBe(false);
    },
  );

  it("validates against the form named by the form attribute", () => {
    render(MultiSelectFormAttribute, {
      props: { selectedIds: [], required: true },
    });

    expect(getForm().checkValidity()).toBe(false);
  });
});
