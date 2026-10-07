<script>
  /**
   * Specify the size of the search input.
   * Inherits the parent `Form` size when unset, otherwise `"xl"`.
   * @type {"xs" | "sm" | "lg" | "xl"}
   * @default "xl"
   */
  export let size = undefined;

  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize ?? "xl";
</script>

<div
  class:bx--skeleton={true}
  class:bx--search--xs={effectiveSize === "xs"}
  class:bx--search--sm={effectiveSize === "sm"}
  class:bx--search--lg={effectiveSize === "lg"}
  class:bx--search--xl={effectiveSize === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true}></span>
  {/if}
  <div class:bx--search-input={true}></div>
</div>
