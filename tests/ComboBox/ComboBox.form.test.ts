import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.form.test.svelte";
import { getInput } from "./helpers";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("ComboBox form participation", () => {
  it("renders no hidden input and no input name when name is omitted", () => {
    const { container } = render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack" },
    });

    expect(getInput()).not.toHaveAttribute("name");
    expect(container.querySelector('input[type="hidden"]')).toBeNull();
    expect(Array.from(new FormData(getForm()).keys())).toHaveLength(0);
  });

  it("serializes the initially selected id, not the text", () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    expect(getInput()).not.toHaveAttribute("name");
    expect(new FormData(getForm()).get("contact")).toBe("0");
  });

  it("serializes an empty string when nothing is selected", () => {
    render(ComboBox, {
      props: { items, name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("serializes the newly selected id after choosing an option from the menu", async () => {
    render(ComboBox, {
      props: { items, name: "contact" },
    });

    const input = getInput();
    await user.click(input);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    expect(input).toHaveAttribute("aria-expanded", "false");
    const formData = new FormData(getForm());
    expect(formData.getAll("contact")).toEqual(["1"]);
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

  it("keeps the selected id while typing without a match, then blurring", async () => {
    render(ComboBox, {
      props: { items, selectedId: "0", value: "Slack", name: "contact" },
    });

    const input = getInput();
    await user.click(input);
    await user.keyboard(" typing");

    expect(new FormData(getForm()).get("contact")).toBe("0");

    await user.click(document.body);

    expect(new FormData(getForm()).get("contact")).toBe("0");
  });

  it("serializes the selected id while closed with virtualize enabled", () => {
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

    expect(new FormData(getForm()).get("contact")).toBe("42");
  });

  it("serializes an empty string when the selected item is disabled", () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack", disabled: true },
      { id: "1", text: "Email" },
    ];

    render(ComboBox, {
      props: { items: itemsWithDisabled, selectedId: "0", name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  describe("disabled", () => {
    it("omits the field when a selection is present", () => {
      const { container } = render(ComboBox, {
        props: {
          items,
          selectedId: "1",
          value: "Email",
          name: "contact",
          disabled: true,
        },
      });

      expect(new FormData(getForm()).has("contact")).toBe(false);
      expect(container.querySelector('input[type="hidden"]')).toBeDisabled();
    });
  });

  describe("inputName", () => {
    it("names the text input and submits the displayed text", () => {
      render(ComboBox, {
        props: {
          items,
          selectedId: "0",
          value: "Slack",
          name: "contact",
          inputName: "contact_text",
        },
      });

      expect(getInput()).toHaveAttribute("name", "contact_text");
      const formData = new FormData(getForm());
      expect(formData.get("contact")).toBe("0");
      expect(formData.get("contact_text")).toBe("Slack");
    });

    it("submits custom text under inputName and an empty id under name", async () => {
      render(ComboBox, {
        props: {
          items,
          name: "contact",
          inputName: "contact_text",
          allowCustomValue: true,
        },
      });

      await user.click(getInput());
      await user.keyboard("Carrier pigeon");
      await user.click(document.body);

      const formData = new FormData(getForm());
      expect(formData.get("contact_text")).toBe("Carrier pigeon");
      expect(formData.get("contact")).toBe("");
    });
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
    expect(new FormData(getForm()).get("contact")).toBe("2");
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
    expect(new FormData(getForm()).get("contact")).toBe("1");
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
