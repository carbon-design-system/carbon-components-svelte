<script>
  export let text = undefined;
  export let iconDescription = 'Expand/Collapse';
  export let expanded = false;
  export let href = '/';

  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx } from '../../../lib';

  let listItemSubMenu = undefined;

  const mouseUp = ({ target }) => {
    if (listItemSubMenu) {
      if (listItemSubMenu.contains(target) || target === listItemSubMenu) {
        expanded = !expanded;
      } else {
        if (expanded) {
          expanded = false;
        }
      }
    }
  };
</script>

<svelte:window on:mouseup={mouseUp} />

<li class={cx('--header__submenu')} title={iconDescription}>
  <a
    bind:this={listItemSubMenu}
    aria-haspopup="menu"
    aria-expanded={expanded}
    class={cx('--header__menu-item', '--header__menu-title')}
    role="menuitem"
    tabindex="0"
    aria-label={text}
    {href}
    on:keydown
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        expanded = !expanded;
      }
    }}
    on:click|preventDefault
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:focus
    on:blur>
    {text}
    <ChevronDown16 class={cx('--header__menu-arrow')} aria-label={iconDescription} />
  </a>
  <ul aria-label={text} class={cx('--header__menu')} role="menu">
    <slot />
  </ul>
</li>
