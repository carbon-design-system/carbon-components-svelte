<script>
  /**
   * Set the type of code snippet.
   * @type {"single" | "multi"}
   */
  export let type = "single";

  /**
   * Specify the number of code rows of the multi-line snippet it stands
   * in for. The skeleton is that snippet's collapsed height, within
   * `minCollapsedNumberOfRows` and `maxCollapsedNumberOfRows`.
   */
  export let rows = 3;

  /**
   * Specify the minimum number of rows shown, as on `CodeSnippet`.
   * Set to `0` for no minimum.
   */
  export let minCollapsedNumberOfRows = 3;

  /**
   * Specify the maximum number of rows shown, as on `CodeSnippet`.
   * Set to `0` for no maximum.
   */
  export let maxCollapsedNumberOfRows = 15;

  $: multi = type === "multi";
  // No maximum: a cap the rows (plus the code's bottom padding) never reach.
  $: maxRows =
    maxCollapsedNumberOfRows > 0 ? maxCollapsedNumberOfRows : rows + 2;
</script>

<div
  class:bx--skeleton={true}
  class:bx--snippet={true}
  class:bx--snippet--single={type === "single"}
  class:bx--snippet--multi={type === "multi"}
  style:--ccs-code-snippet-rows={multi ? rows : undefined}
  style:--ccs-code-snippet-min-rows={multi
    ? Math.max(minCollapsedNumberOfRows, 0)
    : undefined}
  style:--ccs-code-snippet-max-rows={multi ? maxRows : undefined}
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--snippet-container={true}>
    {#if type === "single"}
      <span></span>
    {:else if type === "multi"}
      <span></span> <span></span> <span></span>
    {/if}
  </div>
</div>
