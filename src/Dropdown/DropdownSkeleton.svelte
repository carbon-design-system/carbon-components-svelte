<script>
  /** Set to `true` to use the inline variant */
  export let inline = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--skeleton="{true}"
  class:cds--dropdown-v2="{true}"
  class:cds--list-box="{true}"
  class:cds--form-item="{true}"
  class:cds--list-box--inline="{inline}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div role="button" class:cds--list-box__field="{true}">
    <span class:cds--list-box__label="{true}"></span>
  </div>
</div>
