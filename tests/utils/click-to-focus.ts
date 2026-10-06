import { tick } from "svelte";

/**
 * Mimics a click that focuses `input`: mousedown, focus, then a cancelable
 * mouseup once the component's select-on-focus has run. Returns the mouseup.
 * jsdom never collapses the selection the way WebKit does, so assert that the
 * mouseup was cancelled (`defaultPrevented`); the e2e suite covers WebKit.
 */
export async function clickToFocus(input: HTMLElement) {
  input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  input.focus();
  await tick();
  const mouseup = new MouseEvent("mouseup", {
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(mouseup);
  return mouseup;
}
