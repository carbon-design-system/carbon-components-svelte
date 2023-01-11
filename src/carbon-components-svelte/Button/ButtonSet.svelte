<script>
  /** Set to `true` to stack the buttons vertically */
  export let stacked = false;
</script>

<div
  class:bx--btn-set="{true}"
  class:bx--btn-set--stacked="{stacked}"
  {...$$restProps}
>
  <slot />
</div>
