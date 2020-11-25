<script>
  /**
   * Set the selected radio button value
   * @type {string}
   */
  export let selected = undefined;

  /** Set to `true` to disable the radio buttons */
  export let disabled = false;

  /**
   * Specify the label position
   * @type {"right" | "left"}
   */
  export let labelPosition = "right";

  /**
   * Specify the orientation of the radio buttons
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /**
   * Set an id for the container div element
   * @type {string}
   */
  export let id = undefined;

  import {
    beforeUpdate,
    createEventDispatcher,
    onMount,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("RadioButtonGroup", {
    selectedValue,
    add: ({ checked, value }) => {
      if (checked) {
        selectedValue.set(value);
      }
    },
    update: (value) => {
      selected = value;
    },
  });

  onMount(() => {
    $selectedValue = selected;
  });

  beforeUpdate(() => {
    $selectedValue = selected;
  });

  selectedValue.subscribe((value) => {
    selected = value;
    dispatch("change", value);
  });
</script>

<div
  id="{id}"
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:bx--radio-button-group="{true}"
    class:bx--radio-button-group--vertical="{orientation === 'vertical'}"
    class="{labelPosition && `bx--radio-button-group--label-${labelPosition}`}"
    disabled="{disabled}"
  >
    <slot />
  </div>
</div>
