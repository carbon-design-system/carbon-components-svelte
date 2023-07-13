<script>
  /** @type {"sm" | "default"} */
  export let size = "default";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  class:bx--tag="{true}"
  class:bx--tag--sm="{size === 'sm'}"
  class:bx--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave></span>
