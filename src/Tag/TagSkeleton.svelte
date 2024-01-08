<script>
  /** @type {"sm" | "default"} */
  export let size = "default";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  class:cds--tag="{true}"
  class:cds--tag--sm="{size === 'sm'}"
  class:cds--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave></span>
