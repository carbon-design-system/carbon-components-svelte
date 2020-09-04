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
  {#if !hideLabel}<span class:bx--label={true} class:bx--skeleton={true} />{/if}
  <div class:bx--select={true} class:bx--skeleton={true}>
    <div class:bx--select-input={true} />
  </div>
</div>
