<script>
  let className = undefined;
  export { className as class };
  export let isSelected = false;
  export let style = undefined;

  import { cx } from '../../lib';

  // TODO: include ariaLabel, onExpand, isExpanded, isSelected
</script>

<tr
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx(isSelected && '--data-table--selected', className)}
  {style}>
  <slot />
</tr>
