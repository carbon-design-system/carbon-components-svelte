<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<tr
  {...$$restProps}
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</tr>
