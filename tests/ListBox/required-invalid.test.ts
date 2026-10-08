import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import ComboBox from "../ComboBox/ComboBox.form.test.svelte";
import Dropdown from "../Dropdown/Dropdown.form.test.svelte";
import MultiSelect from "../MultiSelect/MultiSelect.form.test.svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
];

const cases = [
  { name: "Dropdown", component: Dropdown, text: "Select an item" },
  { name: "ComboBox", component: ComboBox, text: "Select an item" },
  {
    name: "MultiSelect",
    component: MultiSelect,
    text: "Select at least one item",
  },
];

describe.each(cases)("$name required invalid state", ({ component, text }) => {
  it("replaces the browser bubble with the Carbon invalid state", async () => {
    render(component, { props: { items, required: true } });
    const invalidEvents: Event[] = [];
    getForm().addEventListener("invalid", (e) => invalidEvents.push(e), true);

    expect(screen.queryByText(text)).toBeNull();
    expect(getForm().reportValidity()).toBe(false);
    await tick();

    expect(invalidEvents).toHaveLength(1);
    expect(invalidEvents[0].defaultPrevented).toBe(true);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("clears the invalid state once an item is selected", async () => {
    render(component, { props: { items, required: true } });
    getForm().reportValidity();
    await tick();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Email" }));

    expect(screen.queryByText(text)).toBeNull();
  });

  it("clears the invalid state when the form resets", async () => {
    render(component, { props: { items, required: true } });
    getForm().reportValidity();
    await tick();

    getForm().reset();

    await vi.waitFor(() => expect(screen.queryByText(text)).toBeNull());
  });

  it("prefers the consumer's own invalid text", async () => {
    render(component, {
      props: {
        items,
        required: true,
        invalid: true,
        invalidText: "Pick a channel",
      },
    });
    getForm().reportValidity();
    await tick();

    expect(screen.getByText("Pick a channel")).toBeInTheDocument();
    expect(screen.queryByText(text)).toBeNull();
  });
});
