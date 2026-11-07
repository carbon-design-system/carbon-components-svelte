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
   * Set the size an `AILabel` renders at, or derive it from the label variant.
   * @type {string | ((variant: "default" | "inline") => string)}
   */
  export let labelSize = "mini";

  /**
   * Force the variant of an `AILabel`.
   * @type {undefined | "default" | "inline"}
   */
  export let labelVariant = undefined;

  /**
   * Set the default alignment of the explanation.
   * @type {"start" | "center" | "end"}
   */
  export let labelAlign = "end";

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { AI_LABEL_HOST_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {import("svelte/store").Writable<undefined | string>} */
  const sharedSize = writable(size);
  $: sharedSize.set(size);

  let claimed = false;

  /** @type {{ set: (value: undefined | "active" | "revert") => void }} */
  const labelState = {
    set(value) {
      claimed = true;
      state.set(value);
    },
  };

  setContext(AI_LABEL_HOST_CONTEXT_KEY, {
    size: sharedSize,
    state: labelState,
    labelSize,
    labelVariant,
    labelAlign,
  });

  // A host starts its state at "active" when the slot is filled, so the AI
  // surface is in the server render. Clear it when no AILabel claimed it.
  onMount(() => {
    if (!claimed) state.set(undefined);
  });
</script>

<div {...$$restProps}>
  <slot />
</div>
