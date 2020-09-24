<script>
  /**
   * Set to `true` to check the input
   * @type {boolean} [checked=false]
   */
  export let checked = false;

  /**
   * Specify the title of the input
   * @type {string} [title="title"]
   */
  export let title = "title";

  /**
   * Specify the value of the input
   * @type {string} [value="value"]
   */
  export let value = "value";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string} [name=""]
   */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
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
