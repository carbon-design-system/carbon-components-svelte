<script>
  let className = undefined;
  export { className as class };
  export let iconDescription = 'Tile checkmark';
  export let id = Math.random();
  export let light = false;
  export let name = '';
  export let selected = false;
  export let style = undefined;
  export let tabindex = '0';
  export let title = 'title';
  export let value = 'value';

  import { createEventDispatcher } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  $: dispatch(selected ? 'select' : 'deselect', id);
</script>

<input
  type="checkbox"
  tabindex="-1"
  class={cx('--tile-input')}
  checked={selected}
  {id}
  {value}
  {name}
  {title} />
<label
  for={id}
  class={cx('--tile', '--tile--selectable', selected && '--tile--is-selected', light && '--tile--light', className)}
  on:click
  on:click|preventDefault={() => {
    selected = !selected;
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={event => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      selected = !selected;
    }
  }}
  {tabindex}
  {style}>
  <span class={cx('--tile__checkmark')}>
    <CheckmarkFilled16 aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class={cx('--tile-content')}>
    <slot />
  </span>
</label>
