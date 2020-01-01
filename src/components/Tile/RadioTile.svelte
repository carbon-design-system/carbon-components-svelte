<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let iconDescription = 'Tile checkmark';
  export let id = Math.random();
  export let light = false;
  export let name = '';
  export let style = undefined;
  export let tabindex = '0';
  export let value = '';

  import { getContext } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import { cx } from '../../lib';

  const { add, update, selectedValue } = getContext('TileGroup');

  add({ value, checked });

  $: checked = value === $selectedValue;
</script>

<input
  type="radio"
  class={cx('--tile-input')}
  on:change
  on:change={() => {
    update(value);
  }}
  {id}
  {name}
  {value}
  {checked} />
<label
  for={id}
  class={cx('--tile', '--tile--selectable', checked && '--tile--is-selected', light && '--tile--light', className)}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={event => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      update(value);
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
