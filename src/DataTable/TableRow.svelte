<script>
  /**
   * Set to `true` to select the row
   * @type {boolean} [isSelected=false]
   */
  export let isSelected = false;

  // TODO: include ariaLabel, onExpand, isExpanded, isSelected
</script>

<tr
  class:bx--data-table--selected="{isSelected}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</tr>
