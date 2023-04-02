<script>
  export let className = null;
  export let contentProps = {};

  /** Obtain a reference to the popover content HTML element */
  export let ref = null;
</script>

<span class:bx--popover="{true}" bind:this="{ref}" {...$$restProps}>
  <span
    class:bx--popover-content="{true}"
    class="{className}"
    {...contentProps}
  >
    <slot />
  </span>
  <span class:bx--popover-caret="{true}"></span>
</span>
