<script>
  export let className = undefined;
  export { className as class };
  export let selectedIndex = 0;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let currentId = writable(null);
  let currentIndex = selectedIndex;
  let switches = [];

  setContext('ContentSwitcher', {
    currentId,
    add: ({ id, text, selected }) => {
      switches = [...switches, { id, text, selected }];

      if (selected) {
        currentIndex = switches.length;
      }
    },
    update: id => {
      currentIndex = switches.map(({ id }) => id).indexOf(id);
    },
    change: direction => {
      let index = currentIndex + direction;

      if (index < 0) {
        index = switches.length - 1;
      } else if (index >= switches.length) {
        index = 0;
      }

      currentIndex = index;
    }
  });

  $: if (switches[currentIndex]) {
    dispatch('change', currentIndex);
    selectedIndex = currentIndex;
    currentId.set(switches[currentIndex].id);
  }
</script>

<div
  role="tablist"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--content-switcher', className)}
  {style}>
  <slot />
</div>
