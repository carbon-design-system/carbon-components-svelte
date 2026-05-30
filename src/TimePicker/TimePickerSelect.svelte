<script>
  /**
   * Specify the select value.
   * @type {number | string}
   * @bindable writable
   */
  export let value = "";

  /** Set to `true` to disable the select */
  export let disabled = false;

  /** Set to `true` for the select to be read-only */
  export let readonly = false;

  /** Specify the ARIA label for the chevron icon */
  export let iconDescription = "Open list of options";

  /** Specify the label text */
  export let labelText = "";

  /** Set an id for the select element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the select element.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the select HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";

  /**
   * @type {import("svelte/store").Writable<number | string>}
   */
  const selectedValue = writable(value);

  setContext("carbon:TimePickerSelect", { selectedValue });

  $: selectedValue.set(value);
  $: value = $selectedValue;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--select={true}
  class:bx--time-picker__select={true}
  class:bx--select--readonly={readonly}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if labelText || $$slots.labelChildren}
    <label for={id} class:bx--label={true} class:bx--visually-hidden={true}>
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <!-- svelte-ignore a11y-no-onchange -->
  <select
    bind:this={ref}
    {id}
    {name}
    {disabled}
    {value}
    aria-readonly={readonly || undefined}
    class:bx--select-input={true}
    on:change={(event) => {
      selectedValue.set(event.target.value);
    }}
    on:change
    on:input
    on:focus
    on:blur
    on:mousedown={(event) => {
      if (readonly) {
        event.preventDefault();
        event.currentTarget.focus();
      }
    }}
    on:keydown={(event) => {
      if (
        readonly &&
        event.key !== "Tab" &&
        event.key !== "Shift" &&
        !(event.altKey && event.key === "ArrowDown")
      ) {
        event.preventDefault();
      }
    }}
  >
    <slot />
  </select>
  <ChevronDown
    aria-label={iconDescription}
    title={iconDescription}
    class="bx--select__arrow"
  />
</div>
