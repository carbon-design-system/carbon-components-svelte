<script>
  let className = undefined;
  export { className as class };
  export let currentIndex = 0;
  export let vertical = false;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _class = cx('--progress', vertical && '--progress--vertical', className);
  let steps = writable([]);
  let stepsById = derived(steps, $steps => $steps.reduce((a, c) => ({ ...a, [c.id]: c }), {}));

  setContext('ProgressIndicator', {
    steps,
    stepsById,
    add: step => {
      steps.update(_ => [
        ..._,
        {
          ...step,
          index: _.length,
          current: _.length === currentIndex,
          complete: _.length <= currentIndex
        }
      ]);
    },
    change: index => {
      dispatch('change', index);
    }
  });
</script>

<ul on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <slot />
</ul>
