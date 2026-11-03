// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import EmojiPicker from "./EmojiPicker.test.svelte";

describe("EmojiPicker server render", () => {
  it("writes the field with the chosen emoji, in its skin tone, and no popover", () => {
    const { document } = renderSSR(EmojiPicker, {
      value: "thumbs_up",
      skinTone: 4,
      name: "status",
    });
    const field = document.querySelector("button[role=combobox]");
    expect(
      field?.querySelector(".bx--list-box__label")?.textContent?.trim(),
    ).toBe("thumbs up");
    expect(field?.querySelector(".bx--emoji-picker__chosen")?.textContent).toBe(
      "\u{1F44D}\u{1F3FE}",
    );
    expect(field?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(
      document.querySelector<HTMLInputElement>("input[name=status]")?.value,
    ).toBe("\u{1F44D}\u{1F3FE}");
  });

  it("writes the name, not an emoji, when the data is still to load", () => {
    const { document } = renderSSR(EmojiPicker, {
      value: "thumbs_up",
      mode: "function",
    });
    const field = document.querySelector("button[role=combobox]");
    expect(
      field?.querySelector(".bx--list-box__label")?.textContent?.trim(),
    ).toBe("thumbs_up");
    expect(field?.querySelector(".bx--emoji-picker__chosen")).toBeNull();
  });

  it("writes the grid of the inline variant, named by CLDR names, with the skin tone selector", () => {
    const { document } = renderSSR(EmojiPicker, { variant: "inline" });
    expect(
      [...document.querySelectorAll("[role=option]")].map((option) =>
        option.getAttribute("aria-label"),
      ),
    ).toEqual([
      "thumbs up",
      "waving hand",
      "grinning face",
      "face with tears of joy",
      "troll",
    ]);
    expect(
      document.querySelectorAll("[role=radiogroup] [role=radio]"),
    ).toHaveLength(6);
  });

  it("writes the icon button of the button variant, named", () => {
    const { document } = renderSSR(EmojiPicker, { variant: "button" });
    const button = document.querySelector("button");
    expect(button?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(button?.textContent).toContain("Add emoji");
  });
});
