<script>
  let className = undefined;
  export { className as class };
  export let orientation = 'horizontal';
  export let labelPosition = 'right';
  export let defaultSelected = undefined;
  export let disabled = false;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let selected = writable(defaultSelected);

  setContext('RadioButtonGroup', {
    selected,
    add: ({ checked, value }) => {
      if (checked) {
        selected.set(value);
      }
    },
    update: value => {
      selected.set(value);
    }
  });

  $: {
    defaultSelected = $selected;
    dispatch('change', $selected);
  }
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item')} {style}>
  <div
    class={cx('--radio-button-group', orientation === 'vertical' && `--radio-button-group--${orientation}`, labelPosition && `--radio-button-group--label-${labelPosition}`, className)}
    {disabled}>
    <slot />
  </div>
</div>
