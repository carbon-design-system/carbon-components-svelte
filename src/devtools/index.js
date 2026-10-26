// Developer tools subpackage: `carbon-components-svelte/devtools`.
// Overlays for checking a layout against Carbon while you build it. Meant
// for development builds, so it stays out of the main entry and its styles
// ship separately: `css/devtools.css` (with `all.css`) or
// `css/devtools-<theme>.css` (with a single-theme sheet).
// May import from core; core must never import from here.

export { default as GridOverlay } from "./GridOverlay/GridOverlay.svelte";
