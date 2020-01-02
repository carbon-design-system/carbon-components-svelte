<script>
  export let href = undefined;
  export let text = undefined;
  export let subMenu = undefined;

  import { cx } from '../../../lib';
  import UIShellSubmenu from './UIShellNavSubmenu.svelte';
</script>

{#if href}
  <li>
    <a
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
      on:blur
      {href}>
      <span class={cx('--text-truncate--end')}>{text}</span>
    </a>
  </li>
{:else}
  <UIShellSubmenu
    {href}
    {text}
    {subMenu}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:keydown
    on:focus
    on:blur />
{/if}
