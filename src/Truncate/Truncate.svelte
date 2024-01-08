<script>
  /** @type {"end" | "front"}*/
  export let clamp = "end";
</script>

<p
  class:cds--text-truncate-end="{clamp === 'end'}"
  class:cds--text-truncate-front="{clamp === 'front'}"
  {...$$restProps}
>
  <slot />
</p>
