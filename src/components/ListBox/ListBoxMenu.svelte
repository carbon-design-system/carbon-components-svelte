<script>
  export let id = "ccs-" + Math.random().toString(36);

  $: menuId = `menu-${id}`;
</script>

<div
  role="listbox"
  id={menuId}
  class:bx--list-box__menu={true}
  {...$$restProps}>
  <slot />
</div>
