<script>
  // TODO: compose as "children" components
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let id = Math.random();
  export let name = '';
  export let iconDescription = 'Tile checkmark';
  export let value = '';
  export let tabIndex = 0;
  export let light = false;
  export let props = {};

  import { createEventDispatcher } from 'svelte';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  function handleChange(event) {
    dispatch('change', event);
  }

  function handleKeyDown(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleChange(event);
    }

    dispatch('keydown', event);
  }

  $: _class = cx(
    '--tile',
    '--tile--selectable',
    checked && '--tile--is-selected',
    light && '--tile--light',
    className
  );
</script>

<input
  {...props}
  type="radio"
  class={cx('--tile-input')}
  on:change
  on:change={handleChange}
  {id}
  {name}
  {value}
  {checked} />
<label for={id} class={_class} tabindex={tabIndex} on:keydown={handleKeyDown}>
  <span class={cx('--tile__checkmark')}>
    <CheckmarkFilled16 aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class={cx('--tile-content')}>
    <slot />
  </span>
</label>
