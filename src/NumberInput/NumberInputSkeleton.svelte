<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to hide the label text */
  export let hideLabel = false;
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true} class:bx--skeleton={true}></span>
  {/if}
  <div
    class:bx--number={true}
    class:bx--skeleton={true}
    class:bx--number--xs={size === "xs"}
    class:bx--number--sm={size === "sm"}
    class:bx--number--xl={size === "xl"}
  ></div>
</div>
