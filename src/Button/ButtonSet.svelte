<script>
  /** Set to `true` to stack the buttons vertically */
  export let stacked = false;
</script>

<div
  class:cds--btn-set="{true}"
  class:cds--btn-set--stacked="{stacked}"
  {...$$restProps}
>
  <slot />
</div>
