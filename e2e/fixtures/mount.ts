import type { ComponentConstructorOptions } from "svelte";

/**
 * Mount a Svelte component into the DOM.
 * @param Component - Svelte component (from .svelte import)
 * @param target - DOM element to mount into; defaults to #app
 */
export function mount(
  Component: new (options?: ComponentConstructorOptions) => unknown,
  target?: HTMLElement | null,
): void {
  const el = target ?? document.getElementById("app");
  if (el) {
    // Use a type assertion to work around Svelte's component constructor typing.
    new (Component as new (o: ComponentConstructorOptions) => unknown)({
      target: el,
    });
  }
}
