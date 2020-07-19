<script>
  export let small = false;
</script>

<div
  class:bx--skeleton={true}
  class:bx--search--xl={!small}
  class:bx--search--sm={small}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <span class:bx--label={true} />
  <div class:bx--search-input={true} />
</div>
