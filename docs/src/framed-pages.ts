/// <reference types="vite/client" />

/** Its own chunk, so the main chunk doesn't carry 668 unused entries. */
import type { Component } from "svelte";

export const framedPages = import.meta.glob<{ default: Component }>([
  "./pages/framed/**/*.svelte",
  "!./pages/framed/**/_*.svelte",
]);
