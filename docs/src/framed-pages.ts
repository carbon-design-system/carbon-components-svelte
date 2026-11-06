/// <reference types="vite/client" />

/**
 * The framed examples, which only a preview's iframe loads. Their map has
 * its own chunk, so the site's main chunk doesn't carry 668 entries it
 * never uses.
 */
import type { Component } from "svelte";

export const framedPages = import.meta.glob<{ default: Component }>([
  "./pages/framed/**/*.svelte",
  "!./pages/framed/**/_*.svelte",
]);
