<form
  class:bx--form="{true}"
  {...$$restProps}
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:submit|preventDefault
>
  <slot />
</form>
