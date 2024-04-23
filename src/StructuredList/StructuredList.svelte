<script>
  // @ts-check

  /**
   * Specify the selected structured list row value
   * @type {string}
   */
  export let selected = undefined;

  /** Set to `true` to use the condensed variant */
  export let condensed = false;

  /** Set to `true` to flush the list */
  export let flush = false;

  /** Set to `true` to use the selection variant */
  export let selection = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  /** @type {import("svelte").EventDispatcher<{ change: string; }>} */
  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("StructuredList", {
    selectedValue,
    update: (value) => {
      selectedValue.set(value);
    },
  });

  $: selected = $selectedValue;
  $: dispatch("change", $selectedValue);
</script>

<div
  role="table"
  class:bx--structured-list="{true}"
  class:bx--structured-list--selection="{selection}"
  class:bx--structured-list--condensed="{condensed}"
  class:bx--structured-list--flush="{flush}"
  {...$$restProps}
>
  <slot />
</div>
