<script>
  // TODO: emit current selected tile
  let className = undefined;
  export { className as class };
  export let selected = false;
  export let id = Math.random();
  export let value = 'value';
  export let title = 'title';
  export let name = '';
  export let iconDescription = 'Tile checkmark';
  export let tabIndex = 0;
  export let light = false;
  export let props = {};

  import { createEventDispatcher, tick } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import { cx } from '../../lib';

  let input = undefined;
  const dispatch = createEventDispatcher();

  function handleChange(event) {
    dispatch('change', event);
  }

  async function handleClick(event) {
    if (event.target !== input) {
      selected = !selected;
      await tick();
    }

    dispatch('click', event);
  }

  async function handleKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      selected = !selected;
      await tick();
    }

    dispatch('keydown', event);
  }

  $: _class = cx(
    '--tile',
    '--tile--selectable',
    selected && '--tile--is-selected',
    light && '--tile--light',
    className
  );
</script>

<input
  bind:this={input}
  type="checkbox"
  tabindex={-1}
  class={cx('--tile-input')}
  on:change={handleChange}
  checked={selected}
  {id}
  {value}
  {name}
  {title} />
<label
  {...props}
  for={id}
  class={_class}
  tabindex={tabIndex}
  on:click|preventDefault={handleClick}
  on:keydown={handleKeyDown}>
  <span class={cx('--tile__checkmark')}>
    <CheckmarkFilled16 aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class={cx('--tile-content')}>
    <slot />
  </span>
</label>
