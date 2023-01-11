<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  class:bx--checkbox-wrapper="{true}"
  class:bx--checkbox-label="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--checkbox-label-text="{true}" class:bx--skeleton="{true}"
  ></span>
</div>
