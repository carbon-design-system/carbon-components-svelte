<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  role="rowgroup"
  class:bx--structured-list-thead="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
