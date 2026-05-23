<script>
  /**
   * Obtain a reference to the form element.
   * @bindable readonly
   */
  export let ref = null;
</script>

<form
  class:bx--form={true}
  bind:this={ref}
  {...$$restProps}
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:submit
>
  <slot />
</form>
