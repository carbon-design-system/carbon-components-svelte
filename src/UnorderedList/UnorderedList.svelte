<script>
  // @ts-check
  
  /** Set to `true` to use the nested variant */
  export let nested = false;

  /** Set to `true` to use expressive type styles */
  export let expressive = false;
</script>

<ul
  class:bx--list--unordered="{true}"
  class:bx--list--nested="{nested}"
  class:bx--list--expressive="{expressive}"
  {...$$restProps}
>
  <slot />
</ul>
