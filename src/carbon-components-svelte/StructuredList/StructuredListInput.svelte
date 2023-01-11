<script>
  /** Set to `true` to check the input */
  export let checked = false;

  /** Specify the title of the input */
  export let title = "title";

  /** Specify the value of the input */
  export let value = "value";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify a name attribute for the input */
  export let name = "";

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext } from "svelte";

  const { selectedValue, update } = getContext("StructuredListWrapper");

  if (checked) {
    update(value);
  }

  $: checked = $selectedValue === value;
</script>

<input
  bind:this="{ref}"
  type="radio"
  tabindex="-1"
  checked="{checked}"
  id="{id}"
  name="{name}"
  title="{title}"
  value="{value}"
  class:bx--structured-list-input="{true}"
  {...$$restProps}
  on:change="{() => {
    update(value);
  }}"
/>
