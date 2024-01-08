<script>
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

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  role="table"
  class:cds--structured-list="{true}"
  class:cds--structured-list--selection="{selection}"
  class:cds--structured-list--condensed="{condensed}"
  class:cds--structured-list--flush="{flush}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</div>
