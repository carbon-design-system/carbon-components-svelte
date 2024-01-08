<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--radio-button-wrapper="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:cds--radio-button="{true}" class:cds--skeleton="{true}"></div>
  <span class:cds--radio-button__label="{true}" class:cds--skeleton="{true}"
  ></span>
</div>
