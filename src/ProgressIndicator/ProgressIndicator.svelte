<script>
  /**
   * Specify the current step index
   * @type {number} [currentIndex=0]
   */
  export let currentIndex = 0;

  /**
   * Set to `true` to use the vertical variant
   */
  export let vertical = false;

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
      dispatch("change", index);
    },
  });
</script>

<ul
  class:bx--progress={true}
  class:bx--progress--vertical={vertical}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
</ul>
