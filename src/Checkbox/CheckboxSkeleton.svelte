<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--form-item="{true}"
  class:cds--checkbox-wrapper="{true}"
  class:cds--checkbox-label="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:cds--checkbox-label-text="{true}" class:cds--skeleton="{true}"
  ></span>
</div>
