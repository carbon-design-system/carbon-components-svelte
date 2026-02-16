<script>
  /**
   * @event {ReadonlyArray<string | number>} change
   */

  /**
   * Set the selected checkbox values.
   * @type {ReadonlyArray<string | number>}
   */
  export let selected = [];

  /** Set to `true` to disable all checkboxes */
  export let disabled = false;

  /**
   * Set to `true` to require at least one selection.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the checkbox inputs.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <CheckboxGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   *   <Checkbox value="a" labelText="Option A" />
   *   <Checkbox value="b" labelText="Option B" />
   * </CheckboxGroup>
   * ```
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Set an id for the container div element.
   * @type {string}
   */
  export let id = undefined;

  import {
    beforeUpdate,
    createEventDispatcher,
    onMount,
    setContext,
  } from "svelte";
  import { readonly, writable } from "svelte/store";

  const dispatch = createEventDispatcher();

  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<string | number>>}
   */
  const selectedValues = writable(selected);
  const groupName = writable(name);
  const groupRequired = writable(required);
  const groupDisabled = writable(disabled);

  /**
   * @type {(value: string | number, checked: boolean) => void}
   */
  const update = (value, checked) => {
    selectedValues.update((prev) => {
      if (checked) {
        return prev.includes(value) ? prev : [...prev, value];
      }
      return prev.filter((v) => v !== value);
    });
  };

  setContext("CheckboxGroup", {
    selectedValues,
    groupName: readonly(groupName),
    groupRequired: readonly(groupRequired),
    groupDisabled: readonly(groupDisabled),
    update,
  });

  onMount(() => {
    $selectedValues = selected;
  });

  beforeUpdate(() => {
    $selectedValues = selected;
  });

  selectedValues.subscribe((value) => {
    selected = value;
    dispatch("change", value);
  });

  $: $groupName = name;
  $: $groupRequired = required;
  $: $groupDisabled = disabled;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  {id}
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <fieldset
    class:bx--checkbox-group={true}
    {disabled}
  >
    {#if legendText || $$slots.legendChildren}
      <legend class:bx--label={true} class:bx--visually-hidden={hideLegend}>
        <slot name="legendChildren">{legendText}</slot>
      </legend>
    {/if}
    <slot />
  </fieldset>
  {#if helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
