import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Dropdown from "./Dropdown.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

const getForm = () => screen.getByTestId("form") as HTMLFormElement;

describe("Dropdown form participation", () => {
  it("does not render a hidden input when name is omitted", () => {
    const { container } = render(Dropdown, {
      props: { items, selectedId: "0" },
    });

    expect(container.querySelector('input[type="hidden"]')).toBeNull();
  });

  it("serializes the initially selected id while the menu stays closed", () => {
    render(Dropdown, {
      props: { items, selectedId: "1", name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("1");
  });

  it("serializes an empty string when nothing is selected", () => {
    render(Dropdown, {
      props: { items, name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("follows selectedId changes made without opening the menu", async () => {
    const { rerender } = render(Dropdown, {
      props: { items, name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("");

    await rerender({ items, name: "contact", selectedId: "2" });

    expect(new FormData(getForm()).get("contact")).toBe("2");
  });

  it("serializes the newly selected id after choosing an option from the menu", async () => {
    render(Dropdown, {
      props: { items, name: "contact" },
    });

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    expect(combobox).toHaveAttribute("aria-expanded", "false");
    const formData = new FormData(getForm());
    expect(formData.getAll("contact")).toEqual(["1"]);
  });

  it("serializes an empty string after the selection is cleared", async () => {
    render(Dropdown, {
      props: { items, selectedId: "0", name: "contact", clearable: true },
    });

    const clearButton = screen.getByRole("button", {
      name: "Clear selected item",
    });
    await user.click(clearButton);

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("treats a disabled selected item as unselected", () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack", disabled: true },
      { id: "1", text: "Email" },
    ];

    render(Dropdown, {
      props: { items: itemsWithDisabled, selectedId: "0", name: "contact" },
    });

    expect(new FormData(getForm()).get("contact")).toBe("");
  });

  it("serializes the selected id while closed with virtualize enabled", () => {
    const largeItems = Array.from({ length: 150 }, (_, i) => ({
      id: String(i),
      text: `Item ${i + 1}`,
    }));

    render(Dropdown, {
      props: {
        items: largeItems,
        selectedId: "42",
        name: "contact",
        virtualize: true,
      },
    });

    expect(new FormData(getForm()).get("contact")).toBe("42");
  });
});
