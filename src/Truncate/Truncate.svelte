<script>
  /** @type {"end" | "front"}*/
  export let direction = "end";
</script>

<p
  class:bx--text-truncate--end="{direction === 'end'}"
  class:bx--text-truncate--front="{direction === 'front'}"
  {...$$restProps}
>
  <slot />
</p>
