<script>
  export let selected = undefined;
  export let disabled = false;
  export let labelPosition = "right"; // "right" | "left"
  export let orientation = "horizontal"; // "horizontal" | "vertical"

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
    update: value => {
      selectedValue.set(value);
    }
  });

  $: selected = $selectedValue;
  $: dispatch("change", $selectedValue);
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <div
    class:bx--radio-button-group={true}
    class:bx--radio-button-group--vertical={orientation === 'vertical'}
    class={labelPosition && `bx--radio-button-group--label-${labelPosition}`}
    {disabled}>
    <slot />
  </div>
</div>
