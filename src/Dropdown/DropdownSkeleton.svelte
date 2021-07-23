<script>
  /** Set to `true` to use the inline variant */
  export let inline = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--skeleton="{true}"
  class:bx--dropdown-v2="{true}"
  class:bx--list-box="{true}"
  class:bx--form-item="{true}"
  class:bx--list-box--inline="{inline}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div role="button" class:bx--list-box__field="{true}">
    <span class:bx--list-box__label="{true}"></span>
  </div>
</div>
