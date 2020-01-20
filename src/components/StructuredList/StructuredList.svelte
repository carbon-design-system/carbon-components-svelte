<script>
  let className = undefined;
  export { className as class };
  export let selected = undefined;
  export let border = false;
  export let selection = false;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let selectedValue = writable(selected);

  setContext('StructuredListWrapper', {
    selectedValue,
    update: value => {
      selectedValue.set(value);
    }
  });

  $: selected = $selectedValue;
  $: {
    dispatch('change', $selectedValue);
  }
</script>

<section
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  aria-label={$$props['aria-label'] || 'Structured list section'}
  class={cx('--structured-list', border && '--structured-list--border', selection && '--structured-list--selection', className)}
  {style}>
  <slot />
</section>
