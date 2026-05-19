<script>
  /**
   * @template {string} [Value=string]
   */

  /**
   * Set to `true` to check the input.
   * @bindable writable
   */
  export let checked = false;

  /** Specify the title of the input */
  export let title = "title";

  /**
   * Specify the value of the input.
   * @type {Value}
   */
  export let value = "value";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Specify a name attribute for the input */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  const initialChecked = checked;
  const ctx = getContext("carbon:StructuredListWrapper");
  const selectedValue =
    ctx?.selectedValue ?? writable(initialChecked ? value : undefined);
  const update = ctx?.update ?? ((v) => selectedValue.set(v));

  if (initialChecked && ctx) {
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
  }}
>
