<script>
  // @ts-check

  /** Set to `true` to use native list styles */
  export let native = false;

  /** Set to `true` to use the nested variant */
  export let nested = false;

  /** Set to `true` to use expressive type styles */
  export let expressive = false;
</script>

<ol
  class:bx--list--ordered="{!native}"
  class:bx--list--ordered--native="{native}"
  class:bx--list--nested="{nested}"
  class:bx--list--expressive="{expressive}"
  {...$$restProps}
>
  <slot />
</ol>
