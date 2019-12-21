<script>
  export let className = undefined;
  export { className as class };
  export let selectedIndex = 0;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _class = cx('--content-switcher', className);
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
    selectedIndex = currentIndex;
    currentId.set(switches[currentIndex].id);
    switches = switches.map((_, i) => ({ ..._, selected: i === currentIndex }));

    const { id, ...rest } = switches[currentIndex];
    dispatch('change', { ...rest, index: currentIndex });
  }
</script>

<div role="tablist" on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <slot />
</div>
