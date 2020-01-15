<script>
  export let href = undefined;
  export let text = undefined;
  export let subMenu = undefined;
  export let iconDescription = 'Expand/Collapse';
  export let expanded = false;

  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx } from '../../../lib';

  let listItemSubMenu = undefined;

  window.addEventListener('mouseup', ({ target }) => {
    if (listItemSubMenu) {
      if (listItemSubMenu.contains(target) || target === listItemSubMenu) {
        expanded = !expanded;
      } else {
        if (expanded) {
          expanded = false;
        }
      }
    }
  });
</script>

<li class={cx('--header__submenu')} title={iconDescription}>
  <a
    bind:this={listItemSubMenu}
    aria-haspopup="menu"
    aria-expanded={expanded}
    class={cx('--header__menu-item', '--header__menu-title')}
    role="menuitem"
    tabindex="0"
    aria-label={text}
    href="javascript:void(0)"
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        expanded = !expanded;
      }
    }}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:focus
    on:blur>
    {text}
    <ChevronDown16 class={cx('--header__menu-arrow')} aria-label={iconDescription} />
  </a>
  <ul aria-label={href} class={cx('--header__menu')} role="menu">
    {#each subMenu as item}
      <li role="none">
        <a
          href={item.href}
          class={cx('--header__menu-item')}
          role="menuitem"
          tabindex="0"
          on:click
          on:mouseover
          on:mouseenter
          on:mouseleave
          on:keyup
          on:keydown
          on:focus
          on:blur>
          <span class={cx('--text-truncate--end')}>{item.text}</span>
        </a>
      </li>
    {/each}
  </ul>
</li>
