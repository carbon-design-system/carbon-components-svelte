<script>
  /** Specify the current step index */
  export let currentIndex = 0;

  /** Set to `true` to use the vertical variant */
  export let vertical = false;

  /** Set to `true` to specify whether the progress steps should be split equally in size in the div */
  export let spaceEqually = false;

  /** Set to `true` to prevent `currentIndex` from updating */
  export let preventChangeOnClick = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable, derived } from "svelte/store";

  const dispatch = createEventDispatcher();
  const steps = writable([]);
  const stepsById = derived(steps, ($) =>
    $.reduce((a, c) => ({ ...a, [c.id]: c }), {})
  );
  const preventChangeOnClickStore = writable(preventChangeOnClick);

  setContext("ProgressIndicator", {
    steps,
    stepsById,
    preventChangeOnClick: { subscribe: preventChangeOnClickStore.subscribe },
    add: (step) => {
      steps.update((_) => {
        if (step.id in $stepsById) {
          return _.map((_step) => {
            if (_step.id === step.id) return { ..._step, ...step };
            return _step;
          });
        }

        return [
          ..._,
          {
            ...step,
            index: _.length,
            current: _.length === currentIndex,
            complete: step.complete,
          },
        ];
      });
    },
    change: (index) => {
      if (preventChangeOnClick) return;
      currentIndex = index;

      /** @event {number} change */
      dispatch("change", index);
    },
  });

  $: steps.update((_) =>
    _.map((step, i) => ({
      ...step,
      current: i === currentIndex,
    }))
  );
  $: preventChangeOnClickStore.set(preventChangeOnClick);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<ul
  class:bx--progress="{true}"
  class:bx--progress--vertical="{vertical}"
  class:bx--progress--space-equal="{spaceEqually && !vertical}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</ul>
