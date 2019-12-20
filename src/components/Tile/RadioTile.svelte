<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let id = Math.random();
  export let name = '';
  export let iconDescription = 'Tile checkmark';
  export let value = '';
  export let tabindex = '0';
  export let light = false;
  export let style = undefined;

  import { getContext } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import { cx } from '../../lib';

  const { addTile, updateSelected, selected } = getContext('TileGroup');

  addTile({ id, value, checked });

  $: checked = value === $selected.value;
  $: _class = cx(
    '--tile',
    '--tile--selectable',
    checked && '--tile--is-selected',
    light && '--tile--light',
    className
  );
</script>

<input
  type="radio"
  class={cx('--tile-input')}
  on:change
  on:change={() => {
    updateSelected({ id, value });
  }}
  {id}
  {name}
  {value}
  {checked} />
<label
  for={id}
  class={_class}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={event => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      updateSelected({ id, value });
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
