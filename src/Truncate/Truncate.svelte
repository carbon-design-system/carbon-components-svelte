<script>
  /** @type {"end" | "front"}*/
  export let clamp = "end";
</script>

<p
  class:bx--text-truncate--end="{clamp === 'end'}"
  class:bx--text-truncate--front="{clamp === 'front'}"
  {...$$restProps}
>
  <slot />
</p>
