<script>
  /** Set an id to be used by the label element */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<label
  class:bx--label="{true}"
  for="{id}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</label>
