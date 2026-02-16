<script>
  /**
   * @generics {Value extends string | number = string | number} Value
   * @template {string | number} Value
   * @event {Value} change
   */

  /**
   * Set the selected radio button value.
   * @type {Value | undefined}
   */
  export let selected = undefined;

  /** Set to `true` to disable the radio buttons */
  export let disabled = false;

  /**
   * Set to `true` to require the selection of a radio button.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Specify a name attribute for the radio button inputs.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   * @example
   * ```svelte
   * <RadioButtonGroup>
   *   <span slot="legendChildren">Custom Legend</span>
   *   <RadioButton labelText="Option 1" value="1" />
   *   <RadioButton labelText="Option 2" value="2" />
   *   <RadioButton labelText="Option 3" value="3" />
   * </RadioButtonGroup>
   * ```
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Specify the label position.
   * @type {"right" | "left"}
   */
  export let labelPosition = "right";

  /**
   * Specify the orientation of the radio buttons.
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

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
   * @type {import("svelte/store").Writable<Value | undefined>}
   */
  const selectedValue = writable(selected);
  const groupName = writable(name);
  const groupRequired = writable(required);

  /**
   * @type {(data: { checked: boolean; value: Value }) => void}
   */
  const add = ({ checked, value }) => {
    if (checked) {
      selectedValue.set(value);
    }
  };

  /**
   * @type {(value: Value) => void}
   */
  const update = (value) => {
    selected = value;
  };

  setContext("carbon:RadioButtonGroup", {
    selectedValue,
    groupName: readonly(groupName),
    groupRequired: readonly(groupRequired),
    add,
    update,
  });

  onMount(() => {
    $selectedValue = selected;
  });

  beforeUpdate(() => {
    $selectedValue = selected;
  });

  selectedValue.subscribe((value) => {
    selected = value;
    dispatch("change", value);
  });

  $: $groupName = name;
  $: $groupRequired = required;
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
    class:bx--radio-button-group={true}
    class:bx--radio-button-group--vertical={orientation === "vertical"}
    class:bx--radio-button-group--label-left={labelPosition === "left"}
    class:bx--radio-button-group--label-right={labelPosition === "right"}
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
