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
  export let id = uniqueId();

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

  import { getContext, onMount, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  const formContext = getContext(FORM_CONTEXT_KEY);
  const timePickerContext = getContext("carbon:TimePicker");
  const parentReadonly = timePickerContext?.readonly ?? readable(false);
  const parentDisabled = timePickerContext?.disabled ?? readable(false);

  /**
   * @type {import("svelte/store").Writable<number | string>}
   */
  const selectedValue = writable(value);

  /**
   * `typeof` each `SelectItem` value, so a change keeps numeric values
   * numeric.
   * @type {Record<string, string>}
   */
  const itemTypesByValue = {};

  /** @type {string | null} */
  let defaultItemId = null;
  /** @type {string | number | undefined} */
  let defaultItemValue = undefined;
  let hasEmptyItem = false;

  /**
   * Record each `SelectItem`. The first item to register is the default
   * when `value` is `""`, and keeps that role if its value changes, as
   * in `Select`.
   * @type {(id: string, itemValue: string | number) => void}
   */
  function setDefaultValue(id, itemValue) {
    itemTypesByValue[itemValue] = typeof itemValue;
    if (defaultItemId === null || defaultItemId === id) {
      defaultItemId = id;
      defaultItemValue = itemValue;
    }
    if (itemValue === "") hasEmptyItem = true;
  }

  setContext("carbon:TimePickerSelect", { selectedValue, setDefaultValue });

  onMount(() => timePickerContext?.registerSelect?.() ?? noop);

  // An item with the value "" makes "" a real choice, so leave it alone.
  $: if (value === "" && !hasEmptyItem && defaultItemValue !== undefined) {
    value = defaultItemValue;
  }
  $: selectedValue.set(value);
  $: value = $selectedValue;
  $: isFluid = !!timePickerContext?.isFluid || !!formContext?.isFluid;
  $: effectiveReadonly = readonly || $parentReadonly;
  $: effectiveDisabled = disabled || $parentDisabled;

  function handleSelectChange(event) {
    let next = event.target.value;
    if (itemTypesByValue[next] === "number") next = Number(next);
    selectedValue.set(next);
  }

  function handleSelectMousedown(event) {
    if (effectiveReadonly) {
      event.preventDefault();
      event.currentTarget.focus();
    }
  }

  function handleSelectKeydown(event) {
    // Ctrl/Cmd shortcuts (copy, find, reload) never change the value.
    if (
      effectiveReadonly &&
      event.key !== "Tab" &&
      event.key !== "Shift" &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
    }
  }
</script>

{#if isFluid}
  <div class:bx--form-item={true} class:bx--select--fluid={true}>
    <div
      class:bx--select={true}
      class:bx--time-picker__select={true}
      class:bx--select--readonly={effectiveReadonly}
      class:bx--select--disabled={effectiveDisabled}
      {...$$restProps}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave
    >
      {#if labelText || $$slots.labelChildren}
        <label
          for={id}
          class:bx--label={true}
          class:bx--label--disabled={effectiveDisabled}
          class:bx--label--slotted={$$slots.labelChildren}
        >
          <slot name="labelChildren"> {labelText} </slot>
        </label>
      {/if}
      <div class:bx--select-input__wrapper={true}>
        <select
          bind:this={ref}
          {id}
          {name}
          disabled={effectiveDisabled}
          {value}
          aria-readonly={effectiveReadonly || undefined}
          class:bx--select-input={true}
          on:change={handleSelectChange}
          on:change
          on:input
          on:focus
          on:blur
          on:mousedown={handleSelectMousedown}
          on:keydown={handleSelectKeydown}
        >
          <slot />
        </select>
        <ChevronDown
          aria-label={iconDescription}
          title={iconDescription}
          class="bx--select__arrow"
        />
      </div>
    </div>
  </div>
{:else}
  <div
    class:bx--select={true}
    class:bx--time-picker__select={true}
    class:bx--select--readonly={effectiveReadonly}
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
    <select
      bind:this={ref}
      {id}
      {name}
      disabled={effectiveDisabled}
      {value}
      aria-readonly={effectiveReadonly || undefined}
      class:bx--select-input={true}
      on:change={handleSelectChange}
      on:change
      on:input
      on:focus
      on:blur
      on:mousedown={handleSelectMousedown}
      on:keydown={handleSelectKeydown}
    >
      <slot />
    </select>
    <ChevronDown
      aria-label={iconDescription}
      title={iconDescription}
      class="bx--select__arrow"
    />
  </div>
{/if}
