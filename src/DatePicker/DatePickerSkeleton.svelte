<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to use the range variant */
  export let range = false;

  /** Set to `true` to use the short variant */
  export let short = false;
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:bx--date-picker={true}
    class:bx--skeleton={true}
    class:bx--date-picker--range={range}
    class:bx--date-picker--simple={!range}
    class:bx--date-picker--short={short}
  >
    {#each Array.from({ length: range ? 2 : 1 }, (_, i) => i) as input (input)}
      <div class:bx--date-picker-container={true}>
        <span class:bx--label={true}></span>
        <div
          class:bx--date-picker__input={true}
          class:bx--skeleton={true}
          class:bx--date-picker__input--xs={size === "xs"}
          class:bx--date-picker__input--sm={size === "sm"}
          class:bx--date-picker__input--xl={size === "xl"}
        ></div>
      </div>
    {/each}
  </div>
</div>
