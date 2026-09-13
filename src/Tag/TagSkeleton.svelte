<script>
  /** @type {"sm" | "default" | "lg"} */
  export let size = "default";
</script>

<span
  class:bx--tag={true}
  class:bx--tag--sm={size === "sm"}
  class:bx--tag--lg={size === "lg"}
  class:bx--skeleton={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
></span>
