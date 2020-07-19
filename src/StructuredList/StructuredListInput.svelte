<script>
  export let checked = false;
  export let title = "title";
  export let value = "value";
  export let id = "ccs-" + Math.random().toString(36);
  export let name = "";
  export let ref = null;

  import { getContext } from "svelte";

  const { selectedValue, update } = getContext("StructuredListWrapper");

  if (checked) {
    update(value);
  }

  $: checked = $selectedValue === value;
</script>

<input
  bind:this={ref}
  type="radio"
  tabindex="-1"
  {checked}
  {id}
  {name}
  {title}
  {value}
  class:bx--structured-list-input={true}
  {...$$restProps}
  on:change={() => {
    update(value);
  }} />
