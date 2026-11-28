import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
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

  it("focuses the field, but not while typing in another", () => {
    render(SearchShortcut);

    press({ key: "/" }, screen.getByTestId("other"));
    expect(input("search")).not.toHaveFocus();

    press({ key: "/" });
    expect(input("search")).toHaveFocus();
  });

  it("focuses the field from each of several shortcuts and shows the first", () => {
    render(SearchShortcut);
    const field = screen.getByTestId("several");

    expect(input("several")).toHaveAttribute(
      "aria-keyshortcuts",
      "Control+J J",
    );
    expect(keys(field.querySelector(".bx--search__shortcut"))).toEqual([
      "Ctrl",
      "J",
    ]);

    press({ key: "j" }, screen.getByTestId("other"));
    expect(input("several")).not.toHaveFocus();
    press({ key: "j", ctrlKey: true }, screen.getByTestId("other"));
    expect(input("several")).toHaveFocus();

    screen.getByTestId("other").focus();
    press({ key: "j" });
    expect(input("several")).toHaveFocus();
  });

  it("focuses a field on screen without scrolling the page", () => {
    render(SearchShortcut);
    const focus = vi.spyOn(input("search"), "focus");

    press({ key: "/" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("skips the focus when on:shortcut prevents it", () => {
    render(SearchShortcut, { props: { preventShortcut: true } });

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
    // "Alt+", then an icon at 2ch
    expect(width("arrows")).toBe("6ch");
  });

  it("expands a collapsed search and focuses it", async () => {
    render(SearchShortcut);
    const magnifier = screen
      .getByTestId("expandable")
      .querySelector(".bx--search-magnifier");
    expect(magnifier).toHaveAttribute("aria-keyshortcuts", "Control+Shift+F");

    press({ key: "f", ctrlKey: true, shiftKey: true });
    await tick();
    await tick();
    expect(input("expandable")).toHaveFocus();
  });

  it("keeps the shortcut as the search expands and collapses", async () => {
    render(SearchShortcut);
    const shortcut = { key: "f", ctrlKey: true, shiftKey: true };

    press(shortcut);
    await tick();
    await tick();
    expect(input("expandable")).toHaveFocus();

    // Leaving the empty field collapses it, and the magnifier takes the
    // shortcut back.
    screen.getByTestId("other").focus();
    await tick();
    expect(
      screen.getByTestId("expandable").querySelector(".bx--search--expanded"),
    ).toBeNull();
    expect(press(shortcut).defaultPrevented).toBe(true);
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

    press({ key: "k", ctrlKey: true });
    await tick();
    expect(input("header")).toHaveFocus();
    expect(header.querySelector(".bx--header__search--active")).not.toBeNull();
  });

  it("opens HeaderSearch from each of several shortcuts and shows the first", async () => {
    render(SearchShortcut);
    const header = screen.getByTestId("header-several");
    const button = header.querySelector("button") as HTMLButtonElement;

    expect(button).toHaveAttribute("aria-keyshortcuts", "Control+I I");
    expect(keys(button.querySelector(".bx--header__search-shortcut"))).toEqual([
      "Ctrl",
      "I",
    ]);

    press({ key: "i" });
    await tick();
    expect(input("header-several")).toHaveFocus();
  });
});
