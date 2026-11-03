// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import IconPicker from "./IconPicker.test.svelte";

describe("IconPicker server render", () => {
  it("writes the field with the chosen icon and no popover", () => {
    const { document } = renderSSR(IconPicker, { value: "Add", name: "icon" });
    const field = document.querySelector("button[role=combobox]");
    expect(
      field?.querySelector(".bx--list-box__label")?.textContent?.trim(),
    ).toBe("Add");
    expect(field?.querySelector(".bx--icon-picker__chosen svg")).not.toBeNull();
    expect(field?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(
      document.querySelector<HTMLInputElement>("input[name=icon]")?.value,
    ).toBe("Add");
  });

  it("writes the name, not an icon, when the icons are still to load", () => {
    const { document } = renderSSR(IconPicker, {
      value: "Add",
      mode: "function",
    });
    const field = document.querySelector("button[role=combobox]");
    expect(
      field?.querySelector(".bx--list-box__label")?.textContent?.trim(),
    ).toBe("Add");
    expect(field?.querySelector(".bx--icon-picker__chosen")).toBeNull();
  });

  it("writes the grid of the inline variant", () => {
    const { document } = renderSSR(IconPicker, { variant: "inline" });
    expect(
      [...document.querySelectorAll("[role=option]")].map((option) =>
        option.getAttribute("aria-label"),
      ),
    ).toEqual(["Add", "Edit"]);
  });
});
