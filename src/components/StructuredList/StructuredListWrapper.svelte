<script>
  let className = undefined;
  export { className as class };
  export let defaultSelected = undefined;
  export let border = false;
  export let selection = false;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _class = cx(
    '--structured-list',
    border && '--structured-list--border',
    selection && '--structured-list--selection',
    className
  );

  let selected = writable(defaultSelected);

  setContext('StructuredListWrapper', {
    selected,
    update: value => {
      selected.set(value);
    }
  });

  $: {
    defaultSelected = $selected;
    dispatch('change', $selected);
  }
</script>

<section
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={_class}
  aria-label={$$props['aria-label'] || 'Structured list section'}
  {style}>
  <slot />
</section>
