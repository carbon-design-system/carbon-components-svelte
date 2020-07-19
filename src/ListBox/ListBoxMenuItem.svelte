<script>
  export let active = false;
  export let highlighted = false;
</script>

<div
  class:bx--list-box__menu-item={true}
  class:bx--list-box__menu-item--active={active}
  class:bx--list-box__menu-item--highlighted={highlighted}
  {...$$restProps}
  on:click
  on:mouseenter
  on:mouseleave>
  <div class:bx--list-box__menu-item__option={true}>
    <slot />
  </div>
</div>
