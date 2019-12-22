<script>
  // TODO: fix space not selecting
  let className = undefined;
  export { className as class };
  export let role = 'presentation';
  export let label = '';
  export let tabindex = '0';
  export let href = '#';
  export let disabled = false;
  export let style = undefined;

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
  $: _class = cx(
    '--tabs__nav-item',
    disabled && '--tabs__nav-item--disabled',
    selected && '--tabs__nav-item--selected',
    className
  );
</script>

<li
  tabindex="-1"
  class={_class}
  on:click|preventDefault={() => {
    if (!disabled) {
      update(id);
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={event => {
    if (disabled) {
      return;
    }
    if (event.key === 'ArrowRight') {
      change(1);
    } else if (event.key === 'ArrowLeft') {
      change(-1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      update(id);
    }
  }}
  {role}
  {style}>
  <a
    bind:this={anchorRef}
    role="tab"
    class={cx('--tabs__nav-link')}
    tabindex={disabled ? '-1' : tabindex}
    aria-selected={selected}
    aria-disabled={disabled}
    {href}>
    {label}
  </a>
</li>
