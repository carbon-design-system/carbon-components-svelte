<script>
  /** Specify the number of rows of the text area it stands in for */
  export let rows = 4;
</script>

<div
  class:bx--form-item={true}
  class:bx--text-area--fluid__skeleton={true}
  style:--ccs-text-area-rows={rows}
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--label={true} class:bx--skeleton={true}></span>
  <div class:bx--skeleton={true} class:bx--text-area={true}></div>
</div>
