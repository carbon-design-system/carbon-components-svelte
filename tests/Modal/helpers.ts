import { screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";

/** Settles the deferred `programmatic` close dispatch after `open` flips to false. */
export async function flushProgrammaticClose() {
  await tick();
  await tick();
}

/** Returns the `.bx--modal` overlay element. */
export function getOverlay() {
  const overlay = document.querySelector(".bx--modal");
  assert(overlay);
  return overlay;
}

/** Ways to close an open Modal, keyed by the `close` event's `trigger` detail. */
export const closeVia = {
  "close-button": async () => {
    await user.click(screen.getByLabelText("Close the modal"));
    await tick();
  },
  "escape-key": async () => {
    await user.keyboard("{Escape}");
    await tick();
  },
  "outside-click": async () => {
    await user.click(getOverlay());
    await tick();
  },
  programmatic: async (
    rerender: (props: { open: boolean }) => Promise<void>,
  ) => {
    await rerender({ open: false });
    await flushProgrammaticClose();
  },
};

/** Dispatches the `transform` `transitionend` that ends a Modal's closing transition. */
export async function finishClose() {
  getOverlay().dispatchEvent(
    new TransitionEvent("transitionend", { propertyName: "transform" }),
  );
  await tick();
}

/**
 * Reports a closing transition on the dialog (jsdom has none), so focus is
 * restored only by `transitionend`. Call `mockRestore()` on the result.
 */
export function reportClosingTransition() {
  const getComputedStyle = window.getComputedStyle.bind(window);
  return vi
    .spyOn(window, "getComputedStyle")
    .mockImplementation((element, pseudo) =>
      element instanceof HTMLElement &&
      element.getAttribute("role") === "dialog"
        ? ({ transitionDuration: "0.24s" } as CSSStyleDeclaration)
        : getComputedStyle(element, pseudo),
    );
}
