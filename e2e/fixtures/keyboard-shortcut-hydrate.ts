import { hydrate, mount } from "svelte";
import "carbon-components-svelte/css/all.css";
import KeyboardShortcutHydrateFixture from "./KeyboardShortcutHydrateFixture.svelte";

// The test puts the server markup in #app before this runs.
const target = document.getElementById("app");
if (target) {
  const options = { target };
  if (target.firstChild) hydrate(KeyboardShortcutHydrateFixture, options);
  else mount(KeyboardShortcutHydrateFixture, options);
}
