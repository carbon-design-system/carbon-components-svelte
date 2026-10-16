<script>
  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  /**
   * Set the size of the number input it stands in for.
   * Inherits `"xs"` from a parent `Form`.
   * @type {"xs"}
   */
  export let size = undefined;

  /** Set to `true` to hide the text input */
  export let hideTextInput = false;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? ($formSize === "xs" ? "xs" : undefined);
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
  <div class:bx--slider-container={true} class:bx--skeleton={true}>
    <span class:bx--slider__range-label={true}></span>
    <div class:bx--slider={true}>
      <div class:bx--slider__track={true}></div>
      <div class:bx--slider__filled-track={true}></div>
      <div class:bx--slider__thumb={true}></div>
    </div>
    <span class:bx--slider__range-label={true}></span>
    {#if !hideTextInput}
      <div class:bx--slider-text-input-wrapper={true}>
        <div
          class:bx--slider-text-input={true}
          class:bx--slider-text-input--xs={effectiveSize === "xs"}
          class:bx--skeleton={true}
        ></div>
      </div>
    {/if}
  </div>
</div>
