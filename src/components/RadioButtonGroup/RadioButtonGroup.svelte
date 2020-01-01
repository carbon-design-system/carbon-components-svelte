<script>
  let className = undefined;
  export { className as class };
  export let selected = undefined;
  export let disabled = false;
  export let labelPosition = 'right';
  export let orientation = 'horizontal';
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let selectedValue = writable(selected);

  setContext('RadioButtonGroup', {
    selectedValue,
    add: ({ checked, value }) => {
      if (checked) {
        selectedValue.set(value);
      }
    },
    update: value => {
      selectedValue.set(value);
    }
  });

  $: selected = $selectedValue;
  $: {
    dispatch('change', $selectedValue);
  }
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item')} {style}>
  <div
    class={cx('--radio-button-group', orientation === 'vertical' && `--radio-button-group--${orientation}`, labelPosition && `--radio-button-group--label-${labelPosition}`, className)}
    {disabled}>
    <slot />
  </div>
</div>
