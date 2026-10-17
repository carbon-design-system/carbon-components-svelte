import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import ComboBox from "../ComboBox/ComboBox.form.test.svelte";
import Dropdown from "../Dropdown/Dropdown.form.test.svelte";
import DropdownFormAttribute from "../Dropdown/DropdownRequiredFormAttribute.test.svelte";
import MultiSelect from "../MultiSelect/MultiSelect.form.test.svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
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

/** Click a submit button in `form`, as a user submitting it would. */
async function attemptSubmit(form = getForm()) {
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Submit";
  form.append(button);
  await user.click(button);
  await tick();
}

describe.each(cases)("$name required invalid state", ({ component, text }) => {
  it("replaces the browser bubble with the Carbon invalid state", async () => {
    render(component, { props: { items, required: true } });
    const invalidEvents: Event[] = [];
    getForm().addEventListener("invalid", (e) => invalidEvents.push(e), true);

    expect(screen.queryByText(text)).toBeNull();
    await attemptSubmit();

    expect(invalidEvents).toHaveLength(1);
    expect(invalidEvents[0].defaultPrevented).toBe(true);
    expect(screen.getByText(text)).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });

  it("shows nothing and keeps focus when code calls checkValidity()", async () => {
    render(component, { props: { items, required: true } });
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();

    expect(getForm().checkValidity()).toBe(false);
    await tick();
    await flushMacrotask();

    expect(screen.queryByText(text)).toBeNull();
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it("clears the invalid state once an item is selected", async () => {
    render(component, { props: { items, required: true } });
    await attemptSubmit();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Email" }));

    expect(screen.queryByText(text)).toBeNull();
  });

  it("clears the invalid state when the form resets", async () => {
    render(component, { props: { items, required: true } });
    await attemptSubmit();

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
    await attemptSubmit();

    expect(screen.getByText("Pick a channel")).toBeInTheDocument();
    expect(screen.queryByText(text)).toBeNull();
  });
});

describe("Dropdown required with the form attribute", () => {
  it("blocks the form it names, from outside it", async () => {
    render(DropdownFormAttribute, { props: { items } });
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    getForm().addEventListener("submit", onSubmit);

    expect(getForm().checkValidity()).toBe(false);
    await attemptSubmit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Select an item")).toBeInTheDocument();
  });
});

describe("required list box before a native required field", () => {
  it("focuses the list box, the first invalid field", async () => {
    render(Dropdown, { props: { items, required: true } });
    const native = document.createElement("input");
    native.required = true;
    getForm().append(native);

    await attemptSubmit();

    await vi.waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });
});
