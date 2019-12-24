<script>
  let className = undefined;
  export { className as class };
  export let selected = false;
  export let text = 'Provide text';
  export let disabled = false;
  export let style = undefined;

  import { cx } from '../../lib';
  import { getContext } from 'svelte';

  const id = Math.random();
  const { currentId, add, update, change } = getContext('ContentSwitcher');

  let buttonRef = undefined;

  add({ id, text, selected });

  $: selected = $currentId === id;
  $: if (selected && buttonRef) {
    buttonRef.focus();
  }
</script>

<button
  bind:this={buttonRef}
  role="tab"
  tabindex={selected ? '0' : '-1'}
  aria-selected={selected}
  class={cx('--content-switcher-btn', selected && '--content-switcher--selected', className)}
  on:click
  on:click|preventDefault={() => {
    update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={event => {
    if (event.key === 'ArrowRight') {
      change(1);
    } else if (event.key === 'ArrowLeft') {
      change(-1);
    }
  }}
  {disabled}
  {style}>
  <span class={cx('--content-switcher__label')}>{text}</span>
</button>
