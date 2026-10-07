<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;
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
  <div
    class:bx--number={true}
    class:bx--skeleton={true}
    class:bx--number--xs={effectiveSize === "xs"}
    class:bx--number--sm={effectiveSize === "sm"}
    class:bx--number--xl={effectiveSize === "xl"}
  ></div>
</div>
