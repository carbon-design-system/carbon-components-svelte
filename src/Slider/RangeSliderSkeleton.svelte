<script>
  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  /**
   * Set the size of the number input it stands in for.
   * Inherits `"xs"` from a parent `Form`.
   * @type {"xs"}
   */
  export let size = undefined;

  /** Set to `true` to hide the text inputs */
  export let hideTextInput = false;

  import { getContext } from "svelte";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext("carbon:FormSize");
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
  <div
    class:bx--slider-container={true}
    class:bx--slider-container--two-handles={true}
    class:bx--skeleton={true}
  >
    {#if !hideTextInput}
      <div
        class:bx--slider-text-input-wrapper={true}
        class:bx--slider-text-input-wrapper--lower={true}
      >
        <div
          class:bx--slider-text-input={true}
          class:bx--slider-text-input--xs={effectiveSize === "xs"}
          class:bx--skeleton={true}
        ></div>
      </div>
    {/if}
    <span class:bx--slider__range-label={true}></span>
    <div class:bx--slider={true}>
      <div class:bx--slider__track={true}></div>
      <div class:bx--slider__filled-track={true}></div>
      <div class:bx--slider__thumb={true} style:left="0%"></div>
      <div class:bx--slider__thumb={true} style:left="100%"></div>
    </div>
    <span class:bx--slider__range-label={true}></span>
    {#if !hideTextInput}
      <div
        class:bx--slider-text-input-wrapper={true}
        class:bx--slider-text-input-wrapper--upper={true}
      >
        <div
          class:bx--slider-text-input={true}
          class:bx--slider-text-input--xs={effectiveSize === "xs"}
          class:bx--skeleton={true}
        ></div>
      </div>
    {/if}
  </div>
</div>
