<script>
  // Internal: binds a component's `shortcut` to its element, like the
  // `keyboardShortcut` action. Components render it only while `shortcut` is
  // set, so an app that never sets one doesn't load the binding, and with
  // carbon-preprocess-svelte doesn't ship the parser either. Not part of the
  // public API — no `index.js` export.

  /**
   * The element that takes the shortcut.
   * @type {null | HTMLElement}
   */
  export let node;

  /** @type {string | ReadonlyArray<string>} */
  export let shortcut;

  /** @type {(event: KeyboardEvent) => void} */
  export let run;

  import { onMount } from "svelte";
  import { keyboardShortcut } from "../utils/keyboard-shortcut.js";

  /** @type {null | ReturnType<typeof keyboardShortcut>} */
  let binding = null;
  /** @type {null | HTMLElement} */
  let boundNode = null;

  /**
   * @param {null | HTMLElement} next
   * @param {{ shortcut: string | ReadonlyArray<string>; run: (event: KeyboardEvent) => void }} params
   */
  function bind(next, params) {
    if (next === boundNode) {
      binding?.update(params);
      return;
    }
    binding?.destroy();
    boundNode = next;
    binding = next ? keyboardShortcut(next, params) : null;
  }

  $: bind(node, { shortcut, run });

  onMount(() => () => binding?.destroy());
</script>
