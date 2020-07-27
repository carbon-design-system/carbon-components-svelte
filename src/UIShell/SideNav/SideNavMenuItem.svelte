<script>
  export let isSelected = undefined;
  export let href = undefined;
  export let text = undefined;
</script>

<li role="none" class:bx--side-nav__menu-item={true}>
  <a
    role="menuitem"
    aria-current={isSelected ? 'page' : undefined}
    {href}
    class:bx--side-nav__link={true}
    {...$$restProps}
    on:click>
    <span class:bx--side-nav__link-text={true}>{text}</span>
  </a>
</li>
