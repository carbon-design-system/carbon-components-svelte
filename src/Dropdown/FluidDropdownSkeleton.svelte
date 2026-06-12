<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--list-box__wrapper--fluid={true}
  class:bx--list-box__wrapper--fluid--skeleton={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--skeleton={true} class:bx--list-box={true}>
    <span class:bx--list-box__label={true}></span>
    <div class:bx--list-box__field={true}></div>
  </div>
</div>
