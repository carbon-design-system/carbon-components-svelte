<script>
  /**
   * @event {ReadonlyArray<string | number>} change
   */

  /**
   * Set the selected checkbox values.
   * @type {ReadonlyArray<string | number>}
   * @bindable writable
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

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set an id for the container div element.
   * @type {string}
   */
  export let id = undefined;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { readonly as readOnly, writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<string | number>>}
   */
  const selectedValues = writable(selected);
  const groupName = writable(name);
  const groupRequired = writable(required);
  const groupReadonly = writable(readonly);
  let isInitialRender = true;

  /**
   * @type {(value: string | number, checked: boolean) => void}
   */
  function update(value, checked) {
    if (readonly) return;
    selectedValues.update((prev) => {
      if (checked) {
        return prev.includes(value) ? prev : [...prev, value];
      }
      return prev.filter((v) => v !== value);
    });
  }

  setContext("carbon:CheckboxGroup", {
    selectedValues,
    groupName: readOnly(groupName),
    groupRequired: readOnly(groupRequired),
    readonly: readOnly(groupReadonly),
    update,
  });

  $: if (!readonly && selected !== $selectedValues) $selectedValues = selected;

  const unsubscribe = selectedValues.subscribe((value) => {
    if (readonly) return;
    selected = value;
    if (!isInitialRender) {
      dispatch("change", value);
    }
  });

  onMount(() => {
    tick().then(() => {
      isInitialRender = false;
    });
    return unsubscribe;
  });

  $: $groupName = name;
  $: $groupRequired = required;
  $: $groupReadonly = readonly;

  const fallbackHelperId = `ccs-${Math.random().toString(36)}`;
  $: helperId = id ? `helper-${id}` : fallbackHelperId;
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
    class:bx--checkbox-group--readonly={readonly}
    {disabled}
    aria-describedby={helperText ? helperId : undefined}
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
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
