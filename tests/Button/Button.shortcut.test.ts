import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { loadShortcutBinding } from "../../src/utils/keyboard-shortcut.js";
import ButtonShortcut from "./Button.shortcut.test.svelte";

const press = (init: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  window.dispatchEvent(event);
  return event;
};

describe("Button shortcut", () => {
  it("shows the keys after the label and announces them", () => {
    render(ButtonShortcut);
    const save = screen.getByTestId("save");

    expect(save).toHaveAttribute("aria-keyshortcuts", "Control+S");
    expect(save).toHaveClass("bx--btn--shortcut", "bx--btn--shortcut-end");
    const hint = save.querySelector(".bx--btn__shortcut");
    expect(hint?.querySelector(".bx--kbd")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(hint).toHaveTextContent("CtrlS");
    expect(screen.getByTestId("with-icon")).not.toHaveClass(
      "bx--btn--shortcut-end",
    );
    expect(screen.getByTestId("with-icon")).toHaveClass(
      "bx--btn--shortcut-icon",
    );
  });

  it("shows the keys in an icon-only button's tooltip, outside its name", () => {
    render(ButtonShortcut);
    const button = screen.getByTestId("icon-only");

    expect(button).toHaveAccessibleName("Add");
    expect(
      button.querySelector(".bx--assistive-text .bx--btn__tooltip-shortcut"),
    ).toHaveTextContent("CtrlShiftA");
  });

  it("clicks the button when the shortcut is pressed", async () => {
    render(ButtonShortcut);
    await loadShortcutBinding();

    const event = press({ key: "s", ctrlKey: true });
    await tick();
    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByTestId("shortcuts")).toHaveTextContent("1");
    expect(screen.getByTestId("clicks")).toHaveTextContent("1");
  });

  it("skips the click when on:shortcut prevents it", async () => {
    render(ButtonShortcut, { props: { preventShortcut: true } });
    await loadShortcutBinding();

    press({ key: "s", ctrlKey: true });
    await tick();
    expect(screen.getByTestId("shortcuts")).toHaveTextContent("1");
    expect(screen.getByTestId("clicks")).toHaveTextContent("0");
  });

  it("doesn't answer while disabled", async () => {
    render(ButtonShortcut, { props: { disabled: true } });
    await loadShortcutBinding();

    const event = press({ key: "s", ctrlKey: true });
    await tick();
    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByTestId("shortcuts")).toHaveTextContent("0");
  });

  it("shows the spinner in place of the keys, which keep their room", () => {
    render(ButtonShortcut);
    const button = screen.getByTestId("loading");
    const hint = button.querySelector(".bx--btn__shortcut");

    expect(button).toHaveClass("bx--btn--shortcut-end");
    expect(hint?.querySelector(".bx--btn__loading + .bx--kbd")).not.toBeNull();
    expect(button.querySelectorAll(".bx--btn__loading")).toHaveLength(1);

    const withIcon = screen.getByTestId("loading-icon");
    expect(
      withIcon.querySelector(".bx--btn__shortcut .bx--btn__loading"),
    ).toBeNull();
    expect(withIcon.querySelectorAll(".bx--btn__loading")).toHaveLength(1);
  });
});
