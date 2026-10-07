<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;
</script>

<div
  class:bx--skeleton={true}
  class:bx--dropdown-v2={true}
  class:bx--list-box={true}
  class:bx--form-item={true}
  class:bx--list-box--inline={inline}
  class:bx--list-box--xs={size === "xs"}
  class:bx--list-box--sm={size === "sm"}
  class:bx--list-box--lg={size === "lg"}
  class:bx--list-box--xl={size === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div role="button" class:bx--list-box__field={true}>
    <span class:bx--list-box__label={true}></span>
  </div>
</div>
