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
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  const initialChecked = checked;
  const ctx = getContext("carbon:StructuredListWrapper");
  const multiple = ctx?.multiple ?? false;
  // Standalone (no wrapper context) is always single-select.
  const selectedValue =
    ctx?.selectedValue ?? writable(initialChecked ? value : undefined);
  const update = ctx?.update ?? ((v) => selectedValue.set(v));

  if (initialChecked && ctx) {
    update(value);
  }

  $: checked = multiple
    ? Array.isArray($selectedValue) && $selectedValue.includes(value)
    : $selectedValue === value;
</script>

<input
  bind:this={ref}
  type={multiple ? "checkbox" : "radio"}
  {tabindex}
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
  on:keydown={(event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      ref.click();
    }
  }}
>
