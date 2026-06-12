<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--select--fluid__skeleton={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--label={true} class:bx--skeleton={true}></span>
  <div class:bx--skeleton={true} class:bx--select={true}></div>
</div>
