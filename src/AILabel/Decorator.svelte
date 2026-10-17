<script>
  /**
   * Internal. Wraps a component's `decorator` slot so only the slot content
   * sees the `AILabel` host context.
   */

  /**
   * Receives the state of an `AILabel` in the slot.
   * @type {{ set: (value: undefined | "active" | "revert") => void }}
   */
  export let state;

  /**
   * Set the host's size, which sizes the revert button in extra-small fields.
   * @type {undefined | string}
   */
  export let size = undefined;

  /**
   * Set the size an `AILabel` renders at, or derive it from the label kind.
   * @type {string | ((kind: "default" | "inline") => string)}
   */
  export let labelSize = "mini";

  /**
   * Force the kind of an `AILabel`.
   * @type {undefined | "default" | "inline"}
   */
  export let labelKind = undefined;

  /**
   * Set the default alignment of the explanation.
   * @type {"start" | "center" | "end"}
   */
  export let labelAlign = "end";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { AI_LABEL_HOST_CONTEXT_KEY } from "../constants/context-keys.js";

  const sharedSize = writable(size);
  $: sharedSize.set(size);

  setContext(AI_LABEL_HOST_CONTEXT_KEY, {
    size: sharedSize,
    state,
    labelSize,
    labelKind,
    labelAlign,
  });
</script>

<div {...$$restProps}>
  <slot />
</div>
