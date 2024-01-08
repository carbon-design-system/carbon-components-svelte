<script>
  export let className = null;
</script>

<span class:cds--popover="{true}" {...$$restProps}>
  <span class:cds--popover-content="{true}" class="{className}">
    <slot />
  </span>
  <span class:cds--popover-caret="{true}"></span>
</span>
