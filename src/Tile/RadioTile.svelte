<script>
  /**
   * @restProps {label}
   * @template {string} [Value=string]
   */

  /**
   * Set to `true` to check the tile.
   * @bindable writable
   */
  export let checked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /** Set to `true` to stretch the tile to fill the height of its container */
  export let fullHeight = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /**
   * Specify the value of the radio input.
   * @type {Value}
   */
  export let value = "";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Specify the title for the radio tile checkmark icon.
   * The icon is hidden from assistive technology, so this only sets the
   * tooltip shown on hover.
   */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the radio tile input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the radio input with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import {
    registerRadioButton,
    updateGroupSelection,
  } from "../RadioButton/radio-button-registry.js";
  import { formReset } from "../utils/form-reset.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  // aria attributes should go to the input element, not the label.
  $: ariaDescribedBy = $$restProps["aria-describedby"];
  $: ariaLabelledBy = $$restProps["aria-labelledby"];
  $: labelRestProps = Object.fromEntries(
    Object.entries($$restProps).filter(
      ([propKey]) =>
        propKey !== "aria-describedby" && propKey !== "aria-labelledby",
    ),
  );

  const ctx = getContext("carbon:TileGroup");
  const add = ctx?.add ?? noop;
  const remove = ctx?.remove ?? noop;
  const update = ctx?.update ?? noop;
  const selectedValue = ctx?.selectedValue ?? readable(undefined);
  const groupName = ctx?.groupName ?? readable(undefined);
  const groupForm = ctx?.groupForm ?? readable(undefined);
  const fallbackName = ctx?.fallbackName;
  const groupRequired = ctx?.groupRequired ?? readable(undefined);
  const groupDisabled = ctx?.groupDisabled ?? readable(false);

  // A disabled TileGroup disables the input natively through its fieldset;
  // mirror that in the tile's styling and tab order. The `disabled`
  // attribute stays the tile's own.
  $: effectiveDisabled = disabled || $groupDisabled;

  add({ value, checked });

  // The `checked` this tile last derived from the group. A different
  // `checked` on the next run was written from outside, so push it into the
  // group instead of overwriting it. One block, so the comparison always
  // sees the write before the re-derive.
  let syncedChecked = checked;
  // A checked tile whose `value` changes carries the selection to the new
  // value, as SelectableTile does, rather than leaving the group's
  // `selected` naming a value no radio has.
  let prevValue = value;

  $: if (ctx) {
    let current = $selectedValue;
    if (value !== prevValue) {
      if (current === prevValue && syncedChecked) {
        selectedValue.set(value);
        current = value;
      }
      remove(prevValue);
      add({ value, checked: false });
      prevValue = value;
    }
    if (checked !== syncedChecked) {
      if (checked) current = value;
      else if (current === value) current = undefined;
      selectedValue.set(current);
    }
    const derived = value === current;
    // Write only on change: under Svelte 5, every write to a prop bound to
    // an array item (`bind:checked={a[i]}`) re-runs this block in every tile.
    if (checked !== derived) checked = derived;
    syncedChecked = derived;
  }

  // Standalone tiles that share a `name` form a native radio group, which
  // unchecks the others without an event. Share the RadioButton registry so
  // a checked tile (by click or by prop) unchecks its siblings' `checked`.
  const instanceKey = {};
  /** @type {null | ReturnType<typeof registerRadioButton>} */
  let registration = null;
  let unsubscribeRegistry = noop;

  /** @type {(radioName: string | undefined) => void} */
  function register(radioName) {
    unregister();
    if (!radioName) return;
    registration = registerRadioButton(radioName, instanceKey, checked);
    unsubscribeRegistry = registration.selectedKey.subscribe((key) => {
      if (checked && key !== undefined && key !== instanceKey) checked = false;
    });
  }

  function unregister() {
    unsubscribeRegistry();
    unsubscribeRegistry = noop;
    registration?.unregister();
    registration = null;
  }

  $: if (!ctx) register(name);

  // Push only a false → true change: Svelte 5 re-runs this block for every
  // tile when a parent mutates an array bound with `bind:checked={a[i]}`,
  // and a tile that was already checked must not reclaim the selection.
  let registeredChecked = checked;

  $: if (registration) {
    if (checked && !registeredChecked) updateGroupSelection(name, instanceKey);
    registeredChecked = checked;
  }

  onMount(() => () => {
    unregister();
    remove(value);
  });

  // A form reset restores the radio without a change event. Inside
  // `TileGroup`, the group reads the result back; standalone, sync here.
  function handleFormReset() {
    if (ctx || !ref) return;
    checked = ref.checked;
  }
</script>

<input
  bind:this={ref}
  use:formReset={handleFormReset}
  type="radio"
  {id}
  name={$groupName ?? (name || fallbackName)}
  form={$groupForm ?? form}
  {value}
  {checked}
  tabindex={effectiveDisabled ? undefined : tabindex}
  {disabled}
  required={$groupRequired ?? required}
  aria-describedby={ariaDescribedBy}
  aria-labelledby={ariaLabelledBy}
  class:bx--tile-input={true}
  on:change
  on:change={(event) => {
    if (ctx) update(value);
    else checked = event.currentTarget.checked;
  }}
  on:focus
  on:blur
  on:keydown
  on:keydown={(event) => {
    // Space is left to the native radio, which checks it and fires
    // `change`. Enter has no native radio behavior beyond implicit form
    // submission, so cancel that and click instead; an already-checked
    // radio fires no `change`, matching a pointer click.
    if (event.key === "Enter") {
      event.preventDefault();
      if (!event.currentTarget.checked) event.currentTarget.click();
    }
  }}
>
<label
  for={id}
  class:bx--tile={true}
  class:bx--tile--selectable={true}
  class:bx--tile--is-selected={checked}
  class:bx--tile--light={light}
  class:bx--tile--disabled={effectiveDisabled}
  class:bx--tile--full-height={fullHeight}
  {...labelRestProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span aria-hidden="true" class:bx--tile__checkmark={true}>
    <CheckmarkFilled aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class:bx--tile-content={true}> <slot /> </span>
</label>
