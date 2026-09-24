import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

const getInput = () => screen.getByRole("combobox") as HTMLInputElement;

describe("ComboBox form participation", () => {
  it("does not apply a name attribute to the input when name is omitted", () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack" },
    });

    expect(getInput()).not.toHaveAttribute("name");
    expect(Array.from(new FormData(getForm()).keys())).toHaveLength(0);
  });

  it("serializes the initially selected value while the menu stays closed", () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    expect(getInput()).toHaveAttribute("name", "contact");
    expect(new FormData(getForm()).get("contact")).toBe("Slack");
  });

  it("serializes an empty string when nothing is selected", () => {
    render(ComboBox, {
      props: { items, name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("serializes the newly selected value after choosing an option from the menu", async () => {
    render(ComboBox, {
      props: { items, name: "contact" },
    });

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    expect(input).toHaveAttribute("aria-expanded", "false");
    const formData = new FormData(getForm());
    expect(formData.getAll("contact")).toEqual(["Email"]);
  });

  it("serializes an empty string after the selection is cleared", async () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    const clearButton = screen.getByRole("button", {
      name: "Clear selected item",
    });
    await user.click(clearButton);

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("keeps FormData in sync while typing, and reverts to the selected value on blur without a match", async () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    const input = getInput();
    await user.click(input);
    await user.keyboard(" typing");

    expect(new FormData(getForm()).get("contact")).toBe("Slack typing");

    // No item matches "Slack typing" and allowCustomValue defaults to false,
    // so losing focus without a selection restores the last selected value.
    await user.click(document.body);

    expect(new FormData(getForm()).get("contact")).toBe("Slack");
  });

  it("serializes the selected value while closed with virtualize enabled", () => {
    const largeItems = Array.from({ length: 150 }, (_, i) => ({
      id: String(i),
      text: `Item ${i + 1}`,
    }));

    render(ComboBox, {
      props: {
        items: largeItems,
        selectedId: "42",
        value: "Item 43",
        name: "contact",
        virtualize: true,
      },
    });

    expect(new FormData(getForm()).get("contact")).toBe("Item 43");
  });
});

describe("ComboBox form reset", () => {
  const getBoundSelectedId = () =>
    screen.getByTestId("bound-selected-id").textContent;
  const getBoundValue = () => screen.getByTestId("bound-value").textContent;

  it("resets a client-rendered combo box to empty even with an initial selection", async () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("");
    expect(getBoundSelectedId()).toBe("undefined");
    expect(getBoundValue()).toBe("");
    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("restores the server-rendered default value and does not fire select", async () => {
    const onSelect = vi.fn();

    render(ComboBox, {
      props: {
        items,
        selectedId: "2",
        value: "Fax",
        name: "contact",
        onSelect,
      },
    });

    // Simulate SSR markup: the browser's real default is "Fax", not empty.
    getInput().defaultValue = "Fax";

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    // Snapshot the call count right after selecting, so only reset-time
    // calls (there should be none) are counted below.
    const selectCountAfterSelecting = onSelect.mock.calls.length;

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("Fax");
    expect(getBoundSelectedId()).toBe("2");
    expect(getBoundValue()).toBe("Fax");
    expect(onSelect.mock.calls.length).toBe(selectCountAfterSelecting);
  });

  it("does not let a stale selection resurface when the reset lands while unfocused", async () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    // Unfocus before the reset lands: `afterUpdate`'s restore-on-close block
    // races the deferred reset callback and, without reading
    // `ref.defaultValue`, can win and rewrite `ref.value` back to "Email".
    await user.click(document.body);

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("");
    expect(getBoundSelectedId()).toBe("undefined");
  });

  it("does not resync when the reset is canceled", async () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    getForm().addEventListener("reset", (event) => event.preventDefault());
    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("Email");
    expect(getBoundSelectedId()).toBe("1");
    expect(new FormData(getForm()).get("contact")).toBe("Email");
  });

  it("matches numeric ids case-insensitively, preserving the restored text's casing", async () => {
    const numericItems = [
      { id: 0, text: "Zero" },
      { id: 1, text: "One" },
    ];

    render(ComboBox, {
      props: { items: numericItems, name: "contact" },
    });

    getInput().defaultValue = "zero";

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "One" });
    await user.click(option);

    getForm().reset();
    await flushFormReset();

    expect(getBoundSelectedId()).toBe("0");
    expect(getInput()).toHaveValue("zero");
  });

  it("keeps a restored value that matches no item, with no selection", async () => {
    const onClear = vi.fn();

    render(ComboBox, {
      props: { items, name: "contact", onClear },
    });

    getInput().defaultValue = "custom text";

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("custom text");
    expect(getBoundSelectedId()).toBe("undefined");
    expect(onClear).not.toHaveBeenCalled();
  });
});
