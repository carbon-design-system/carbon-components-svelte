<div
  class:bx--breadcrumb={true}
  class:bx--skeleton={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  {#each [0, 1, 2] as item, i (item)}
    <div class:bx--breadcrumb-item={true}>
      <span class:bx--link={true}>&nbsp;</span>
    </div>
  {/each}
</div>
