<script>
  let className = undefined;
  export { className as class };
  export const translationIds = { close: 'close', open: 'open' };
  export let disabled = false;
  export let id = Math.random();
  export let role = 'combobox';
  export let style = undefined;
  export let tabindex = '-1';
  export let translateWithId = id => defaultTranslations[id];

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const defaultTranslations = {
    [translationIds.close]: 'Close menu',
    [translationIds.open]: 'Open menu'
  };
  const ctx = getContext('MultiSelect') || getContext('Dropdown');

  let fieldRef = undefined;

  $: if (ctx && fieldRef) {
    ctx.declareRef({ key: 'field', ref: fieldRef });
  }

  $: ariaExpanded = $$props['aria-expanded'];
  $: menuId = `menu-${id}`;
</script>

<div
  bind:this={fieldRef}
  role={ariaExpanded ? 'combobox' : role}
  aria-expanded={ariaExpanded}
  aria-owns={(ariaExpanded && menuId) || undefined}
  aria-controls={(ariaExpanded && menuId) || undefined}
  aria-disabled={disabled}
  aria-label={ariaExpanded ? translateWithId('close') : translateWithId('open')}
  tabindex={disabled ? '-1' : tabindex}
  class={cx('--list-box__field', className)}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown|preventDefault|stopPropagation
  on:blur
  {style}>
  <slot />
</div>
