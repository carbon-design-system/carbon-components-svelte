<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  class:bx--list__item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</li>
