<script>
  /**
   * Set the selected radio button value
   * @type {string} [selected]
   */
  export let selected = undefined;

  /**
   * Set to `true` to disable the radio buttons
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the label position
   * @type {"right" | "left"} [labelPosition="right"]
   */
  export let labelPosition = "right";

  /**
   * Specify the orientation of the radio buttons
   * @type {"horizontal" | "vertical"} [orientation="horizontal"]
   */
  export let orientation = "horizontal";

  /**
   * Set an id for the container div element
   * @type {string} [id]
   */
   export let id = "ccs-" + Math.random().toString(36);

  import { createEventDispatcher, setContext } from "svelte";
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
      selectedValue.set(value);
    },
  });

  $: selected = $selectedValue;
  $: dispatch("change", $selectedValue);
</script>

<div
  {id}
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
