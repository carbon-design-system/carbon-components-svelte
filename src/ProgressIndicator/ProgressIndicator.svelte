<script>
  /** Specify the current step index */
  export let currentIndex = 0;

  /** Set to `true` to use the vertical variant */
  export let vertical = false;

  /** Set to `true` to specify whether the progress steps should be split equally in size in the div */
  export let spaceEqually = false;

  /** Set to `true` to prevent updating `currentIndex` */
  export let preventChangeOnClick = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable, derived } from "svelte/store";

  const dispatch = createEventDispatcher();
  const steps = writable([]);
  const stepsById = derived(steps, ($) =>
    $.reduce((a, c) => ({ ...a, [c.id]: c }), {})
  );

  setContext("ProgressIndicator", {
    steps,
    stepsById,
    add: (step) => {
      steps.update((_) => [
        ..._,
        {
          ...step,
          index: _.length,
          current: _.length === currentIndex,
          complete: _.length <= currentIndex,
        },
      ]);
    },
    change: (index) => {
      if (preventChangeOnClick) return;
      currentIndex = index;
      steps.update((_) =>
        [..._].map((step, i) => ({
          ...step,
          current: i === index,
        }))
      );
      dispatch("change", index);
    },
  });
</script>

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
