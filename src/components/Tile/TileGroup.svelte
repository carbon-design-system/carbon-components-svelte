<script>
  let className = undefined;
  export { className as class };
  export let selected = undefined;
  export let disabled = false;
  export let legend = '';
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let selectedValue = writable(selected);

  setContext('TileGroup', {
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
    dispatch('select', $selectedValue);
  }
</script>

<fieldset class={cx('--tile-group', className)} {disabled} {style}>
  {#if legend}
    <legend class={cx('--label')}>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
