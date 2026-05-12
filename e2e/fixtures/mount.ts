import type { Component } from "svelte";
import { mount as mountSvelte } from "svelte";
import "carbon-components-svelte/css/all.css";

/**
 * Mount a Svelte component into the DOM.
 * @param Component - Svelte component (from .svelte import)
 * @param target - DOM element to mount into; defaults to #app
 */
export function mount(Component: Component, target?: HTMLElement | null): void {
  const el = target ?? document.getElementById("app");
  if (el) {
    mountSvelte(Component, { target: el });
  }
}
