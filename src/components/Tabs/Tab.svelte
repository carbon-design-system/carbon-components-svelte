<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let href = '#';
  export let label = '';
  export let role = 'presentation';
  export let style = undefined;
  export let tabindex = '0';

  import { getContext } from 'svelte';
  import { cx } from '../../lib';

  const id = Math.random();
  const { selectedTab, add, update, change } = getContext('Tabs');

  let anchorRef = undefined;

  add({ id, label, disabled });

  $: selected = $selectedTab === id;
  $: if (selected && anchorRef) {
    anchorRef.focus();
  }
</script>

<li
  tabindex="-1"
  class={cx('--tabs__nav-item', disabled && '--tabs__nav-item--disabled', selected && '--tabs__nav-item--selected', className)}
  on:click|preventDefault={() => {
    if (!disabled) {
      update(id);
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={({ key }) => {
    if (!disabled) {
      if (key === 'ArrowRight') {
        change(1);
      } else if (key === 'ArrowLeft') {
        change(-1);
      } else if (key === ' ' || key === 'Enter') {
        update(id);
      }
    }
  }}
  {role}
  {style}>
  <a
    bind:this={anchorRef}
    role="tab"
    tabindex={disabled ? '-1' : tabindex}
    aria-selected={selected}
    aria-disabled={disabled}
    class={cx('--tabs__nav-link')}
    {href}>
    {label}
  </a>
</li>
