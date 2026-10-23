<script>
  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  /** Specify the number of segments, as on the PinCodeInput it stands in for */
  export let count = 4;

  /**
   * Specify the size of the segments.
   * Inherits the parent `Form` size when unset, otherwise `"default"`.
   * Also accepts Carbon v11's `"md"` (`"default"`) and `"lg"` (`"xl"`).
   * @type {"default" | "xs" | "sm" | "xl" | "md" | "lg"}
   * @default "default"
   */
  export let size = undefined;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import {
    normalizeSize,
    PIN_CODE_INPUT_SIZE_ALIASES,
  } from "../utils/size-aliases.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(
    size ?? $formSize ?? "default",
    PIN_CODE_INPUT_SIZE_ALIASES,
  );
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true} class:bx--skeleton={true}></span>
  {/if}
  <div class:bx--pin-code-input__segments={true}>
    {#each Array.from({ length: count }, (_, i) => i) as segment (segment)}
      <div
        class:bx--pin-code-input__field={true}
        class:bx--text-input={true}
        class:bx--text-input--xs={effectiveSize === "xs"}
        class:bx--text-input--sm={effectiveSize === "sm"}
        class:bx--text-input--xl={effectiveSize === "xl"}
        class:bx--skeleton={true}
      ></div>
    {/each}
  </div>
</div>
