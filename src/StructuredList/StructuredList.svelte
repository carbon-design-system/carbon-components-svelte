<script>
  /**
   * Specify the selected structured list row value
   * @type {string} [selected]
   */
  export let selected = undefined;

  /**
   * Set to `true` to use the bordered variant
   * @type {boolean} [border=false]
   */
  export let border = false;

  /**
   * Set to `true` to use the selection variant
   * @type {boolean} [selection=false]
   */
  export let selection = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("StructuredListWrapper", {
    selectedValue,
    update: (value) => {
      selectedValue.set(value);
    },
  });

  $: selected = $selectedValue;
  $: dispatch("change", $selectedValue);
</script>

<div
  aria-label="Structured list section"
  class:bx--structured-list="{true}"
  class:bx--structured-list--border="{border}"
  class:bx--structured-list--selection="{selection}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
</div>
