<script>
  /** Set to `true` to use the nested variant */
  export let nested = false;

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<ul
  class:bx--list--unordered="{true}"
  class:bx--list--nested="{nested}"
  class:bx--list--expressive="{expressive}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</ul>
