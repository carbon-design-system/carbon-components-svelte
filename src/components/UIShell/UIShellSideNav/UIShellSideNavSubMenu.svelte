<script>
  export let href = undefined;
  export let text = undefined;

  import { cx } from '../../../lib';
  import { onDestroy } from 'svelte';
  import isNavItemSelectedStore from './isNavItemSelectedStore';

  let isSelected = undefined;

  const unsubscribe = isNavItemSelectedStore.subscribe(values => {
    values.forEach(item => {
      if (item.id === text) {
        isSelected = item.isSelected;
      }
    });
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<li class={cx('--side-nav__menu-item')} role="none">
  <a
    {href}
    class={cx('--side-nav__link')}
    role="menuitem"
    aria-current={isSelected ? 'page' : ''}
    on:click={() => isNavItemSelectedStore.setSelected(text)}>
    <span class={cx('--side-nav__link-text')}>{text}</span>
  </a>
</li>
