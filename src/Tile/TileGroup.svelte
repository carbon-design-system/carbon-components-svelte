<script>
  export let selected = undefined;
  export let disabled = false;
  export let legend = "";

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("TileGroup", {
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
  $: dispatch("select", $selectedValue);
</script>

<fieldset {disabled} class:bx--tile-group={true} {...$$restProps}>
  {#if legend}
    <legend class:bx--label={true}>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
