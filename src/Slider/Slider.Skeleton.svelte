<script>
  /**
   * Set to `true` to hide the label text
   * @type {boolean} [hideLabel=false]
   */
  export let hideLabel = false;
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  {#if !hideLabel}
    <span class:bx--label={true} class:bx--skeleton={true} />
  {/if}
  <div class:bx--slider-container={true} class:bx--skeleton={true}>
    <span class:bx--slider__range-label={true} />
    <div class:bx--slider={true}>
      <div class:bx--slider__track={true} />
      <div class:bx--slider__filled-track={true} />
      <div class:bx--slider__thumb={true} />
    </div>
    <span class:bx--slider__range-label={true} />
  </div>
</div>
