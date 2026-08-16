import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

const getInput = () => screen.getByRole("combobox") as HTMLInputElement;
const getForm = () => screen.getByTestId("form") as HTMLFormElement;

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
