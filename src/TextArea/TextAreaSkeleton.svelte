<script>
  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the number of rows of the text area it stands in for */
  export let rows = 4;
</script>

<div
  class:bx--form-item={true}
  style:--ccs-text-area-rows={rows}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true} class:bx--skeleton={true}></span>
  {/if}
  <div class:bx--skeleton={true} class:bx--text-area={true}></div>
</div>
