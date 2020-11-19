<script>
  /** Set to `true` to use the nested variant */
  export let nested = false;

  /** Set to `true` to use native list styles */
  export let native = false;
</script>

<ol
  class:bx--list--ordered="{!native}"
  class:bx--list--ordered--native="{native}"
  class:bx--list--nested="{nested}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</ol>
