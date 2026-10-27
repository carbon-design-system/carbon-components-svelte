import { render, screen } from "@testing-library/svelte";
import Kbd from "./Kbd.test.svelte";
import KbdTranslations from "./KbdTranslations.test.svelte";

const keys = (testId: string) =>
  [...screen.getByTestId(testId).querySelectorAll(".bx--kbd__key")].map(
    (key) => key.textContent,
  );

const spoken = (testId: string) =>
  screen.getByTestId(testId).querySelector(".bx--visually-hidden")?.textContent;

describe("Kbd", () => {
  it("shows a shortcut in each platform's order and symbols", () => {
    render(Kbd);

    expect(keys("apple")).toEqual(["⇧", "⌘", "P"]);
    expect(keys("other")).toEqual(["Ctrl", "Shift", "P"]);
  });

  it("names the keys for screen readers and hides the caps", () => {
    render(Kbd);

    expect(spoken("apple")).toBe("Shift Command P");
    expect(spoken("other")).toBe("Control Shift P");
    expect(spoken("escape")).toBe("Escape");
    for (const key of screen
      .getByTestId("apple")
      .querySelectorAll(".bx--kbd__key")) {
      expect(key).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("shows the default slot as one key without a parsable shortcut", () => {
    render(Kbd);

    expect(keys("slot")).toEqual(["Fn"]);
    expect(keys("invalid")).toEqual(["Fallback"]);
    expect(
      screen.getByTestId("slot").querySelector(".bx--kbd__key"),
    ).not.toHaveAttribute("aria-hidden");
  });

  it("translates the words on the keys", () => {
    render(Kbd);

    expect(keys("german")).toEqual(["Strg", "Umschalt", "S"]);
  });

  it("updates the keys when shortcut or translateWithId changes", async () => {
    const { rerender } = render(Kbd);
    expect(keys("dynamic")).toEqual(["Strg", "K"]);

    await rerender({ shortcut: "ctrl+shift+j" });
    expect(keys("dynamic")).toEqual(["Strg", "Umschalt", "J"]);

    await rerender({ locale: "fr" });
    expect(keys("dynamic")).toEqual(["Ctrl", "Maj", "J"]);
  });

  it("sizes the keys", () => {
    render(Kbd);

    expect(screen.getByTestId("sm")).toHaveClass("bx--kbd", "bx--kbd--sm");
    expect(screen.getByTestId("apple")).not.toHaveClass("bx--kbd--sm");
    expect(screen.getByTestId("muted")).toHaveClass(
      "bx--kbd--muted",
      "bx--kbd--apple",
    );
  });

  it("reads shared translations, falling back to English", () => {
    render(KbdTranslations);

    expect(keys("shared")).toEqual(["Strg", "Umschalt", "Enter"]);
    expect(keys("own")).toEqual(["Control", "K"]);
  });
});
