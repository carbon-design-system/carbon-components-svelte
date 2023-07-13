<script>
  /**
   * Set the selected radio button value
   * @type {string}
   */
  export let selected = undefined;

  /** Set to `true` to disable the radio buttons */
  export let disabled = false;

  /** Specify the legend text */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

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

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="{id}"
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <fieldset
    class:bx--radio-button-group="{true}"
    class:bx--radio-button-group--vertical="{orientation === 'vertical'}"
    class:bx--radio-button-group--label-left="{labelPosition === 'left'}"
    class:bx--radio-button-group--label-right="{labelPosition === 'right'}"
    disabled="{disabled}"
  >
    {#if legendText || $$slots.legendText}
      <legend class:bx--label="{true}" class:bx--visually-hidden="{hideLegend}">
        <slot name="legendText">{legendText}</slot>
      </legend>
    {/if}
    <slot />
  </fieldset>
</div>
