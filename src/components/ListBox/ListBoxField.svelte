<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let tabindex = '-1';
  export let role = 'combobox';
  export let disabled = false;
  export const translationIds = { close: 'close', open: 'open' };
  export let translateWithId = id => defaultTranslations[id];
  export let style = undefined;

  import { cx } from '../../lib';

  const defaultTranslations = {
    [translationIds.close]: 'Close menu',
    [translationIds.open]: 'Open menu'
  };

  $: ariaExpanded = $$props['aria-expanded'];
  $: menuId = `menu-${id}`;
</script>

<div
  role={ariaExpanded ? 'combobox' : role}
  aria-owns={(ariaExpanded && menuId) || undefined}
  aria-controls={(ariaExpanded && menuId) || undefined}
  aria-label={ariaExpanded ? translateWithId('close') : translateWithId('open')}
  tabindex={disabled ? '-1' : tabindex}
  class={cx('--list-box__field', className)}
  {style}>
  <slot />
</div>
