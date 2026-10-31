import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { loadShortcutBinding } from "../../src/utils/keyboard-shortcut.js";
import SearchShortcutTranslations from "./Search.shortcut-translations.test.svelte";
import SearchShortcut from "./Search.shortcut.test.svelte";

const press = (init: KeyboardEventInit, target: EventTarget = window) => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

const keys = (root: Element | null | undefined) =>
  [
    ...(root?.querySelectorAll(".bx--kbd__platform--other .bx--kbd__key") ??
      []),
  ].map((key) => key.textContent);

const input = (testId: string) =>
  screen.getByTestId(testId).querySelector("input") as HTMLInputElement;

describe("Search shortcut", () => {
  it("shows the keys in the empty field and announces them", async () => {
    const { rerender } = render(SearchShortcut);
    const field = screen.getByTestId("search");

    expect(input("search")).toHaveAttribute("aria-keyshortcuts", "/");
    expect(field.querySelector(".bx--search")).toHaveClass(
      "bx--search--shortcut",
    );
    expect(field.querySelector(".bx--search__shortcut")).toHaveTextContent("/");

    await rerender({ value: "button" });
    expect(field.querySelector(".bx--search__shortcut")).toBeNull();
  });

  it("focuses the field, but not while typing in another", async () => {
    render(SearchShortcut);
    await loadShortcutBinding();

    press({ key: "/" }, screen.getByTestId("other"));
    expect(input("search")).not.toHaveFocus();

    press({ key: "/" });
    expect(input("search")).toHaveFocus();
  });

  it("skips the focus when on:shortcut prevents it", async () => {
    render(SearchShortcut, { props: { preventShortcut: true } });
    await loadShortcutBinding();

    press({ key: "/" });
    expect(input("search")).not.toHaveFocus();
  });

  it("makes room for the keys in their translated names", () => {
    render(SearchShortcut);
    render(SearchShortcutTranslations);
    const width = (testId: string) =>
      screen
        .getByTestId(testId)
        .querySelector<HTMLElement>(".bx--search")
        ?.style.getPropertyValue("--ccs-search-shortcut-width");

    expect(width("search")).toBe("1ch");
    // "Strg+Umschalt+F", not "Ctrl+Shift+F"
    expect(width("translated")).toBe("15ch");
  });

  it("expands a collapsed search and focuses it", async () => {
    render(SearchShortcut);
    const magnifier = screen
      .getByTestId("expandable")
      .querySelector(".bx--search-magnifier");
    expect(magnifier).toHaveAttribute("aria-keyshortcuts", "Control+Shift+F");
    await loadShortcutBinding();

    press({ key: "f", ctrlKey: true, shiftKey: true });
    await tick();
    await tick();
    expect(input("expandable")).toHaveFocus();
  });

  it("opens HeaderSearch and shows the keys beside its icon", async () => {
    render(SearchShortcut);
    const header = screen.getByTestId("header");
    const button = header.querySelector("button") as HTMLButtonElement;

    expect(button).toHaveAttribute("aria-keyshortcuts", "Control+K");
    expect(header.querySelector(".bx--header__search")).toHaveClass(
      "bx--header__search--shortcut",
    );
    expect(keys(button.querySelector(".bx--header__search-shortcut"))).toEqual([
      "Ctrl",
      "K",
    ]);
    await loadShortcutBinding();

    press({ key: "k", ctrlKey: true });
    await tick();
    expect(input("header")).toHaveFocus();
    expect(header.querySelector(".bx--header__search--active")).not.toBeNull();
  });
});
