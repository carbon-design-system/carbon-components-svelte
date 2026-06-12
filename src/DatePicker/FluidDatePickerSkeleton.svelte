<script>
  import Calendar from "../icons/Calendar.svelte";

  /** Set to `true` to use the range variant */
  export let range = false;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--date-picker--fluid__skeleton={true}
  class:bx--date-picker--fluid__skeleton--range={range}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--date-picker--fluid__skeleton--container={true}>
    <span class:bx--label={true} class:bx--skeleton={true}></span>
    <div class:bx--skeleton={true} class:bx--text-input={true}></div>
    <Calendar class="bx--date-picker__icon" />
  </div>
  {#if range}
    <div class:bx--date-picker--fluid__skeleton--container={true}>
      <span class:bx--label={true} class:bx--skeleton={true}></span>
      <div class:bx--skeleton={true} class:bx--text-input={true}></div>
      <Calendar class="bx--date-picker__icon" />
    </div>
  {/if}
</div>
