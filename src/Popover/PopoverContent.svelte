<script>
  export let className = null;
</script>

<span class:bx--popover="{true}" {...$$restProps}>
  <span class:bx--popover-content="{true}" class="{className}">
    <slot />
  </span>
  <span class:bx--popover-caret="{true}"></span>
</span>
