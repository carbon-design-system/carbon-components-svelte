<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--radio-button-wrapper="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--radio-button="{true}" class:bx--skeleton="{true}"></div>
  <span class:bx--radio-button__label="{true}" class:bx--skeleton="{true}"
  ></span>
</div>
