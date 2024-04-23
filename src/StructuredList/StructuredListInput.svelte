<script>
  // @ts-check

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

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let icon = CheckmarkFilled;

  /** Specify the ARIA label for the accordion item chevron icon. */
  export let iconDescription = "Select an option";

  import { getContext } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";

  const { selectedValue, update } = getContext("StructuredList");

  if (checked) {
    update(value);
  }

  $: checked = $selectedValue === value;
</script>

<input
  bind:this="{ref}"
  type="radio"
  tabindex="{-1}"
  checked="{checked}"
  id="{id}"
  name="{name}"
  title="{title}"
  value="{value}"
  class:bx--structured-list-input="{true}"
  class:bx--visually-hidden="{true}"
  {...$$restProps}
  on:change
  on:change="{() => {
    update(value);
  }}"
/>
<div role="{'cell'}" class:bx--structured-list-td="{true}">
  <svelte:component
    this="{icon}"
    class="bx--structured-list-svg"
    aria-label="{iconDescription}"
  />
</div>
