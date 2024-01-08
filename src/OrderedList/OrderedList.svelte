<script>
  /** Set to `true` to use the nested variant */
  export let nested = false;

  /** Set to `true` to use native list styles */
  export let native = false;

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<ol
  class:cds--list--ordered="{!native}"
  class:cds--list--ordered--native="{native}"
  class:cds--list--nested="{nested}"
  class:cds--list--expressive="{expressive}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</ol>
