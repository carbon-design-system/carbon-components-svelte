<script>
  /**
   * @restProps {label}
   * @event {string} "select"
   * @event {string} "deselect"
   */

  /**
   * @template {string} [Value=string]
   */

  /**
   * Set to `true` to select the tile.
   * @bindable writable
   */
  export let selected = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /** Set to `true` to stretch the tile to fill the height of its container */
  export let fullHeight = false;

  /**
   * Specify the title of the selectable tile.
   * @type {string | undefined}
   */
  export let title = undefined;

  /**
   * Specify the value of the selectable tile.
   * @type {Value}
   */
  export let value = "value";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /**
   * Specify the title of the checkmark icon, shown as a tooltip on hover.
   * The icon is hidden from assistive technology.
   */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import { formReset } from "../utils/form-reset.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  // aria attributes should go to the input element, not the label.
  $: ariaDescribedBy = $$restProps["aria-describedby"];
  $: ariaLabelledBy = $$restProps["aria-labelledby"];
  $: labelRestProps = Object.fromEntries(
    Object.entries($$restProps).filter(
      ([propKey]) =>
        propKey !== "aria-describedby" && propKey !== "aria-labelledby",
    ),
  );

  const ctx = getContext("carbon:SelectableTileGroup");
  const hasGroup = ctx !== undefined;
  const add = ctx?.add ?? noop;
  const remove = ctx?.remove ?? noop;
  const update = ctx?.update ?? noop;
  const register = ctx?.register ?? (() => noop);
  const selectedValues = ctx?.selectedValues ?? readable([]);
  const groupName = ctx?.groupName ?? readable(undefined);
  const groupDisabled = ctx?.groupDisabled ?? readable(false);

  add({ value, selected });

  let unregister = register(value);
  onMount(() => () => unregister());

  let prevValue = value;

  // Captured from the checkbox's `click` event, which fires before `change`,
  // so the group's `update` knows whether Shift was held for range selection.
  let pendingShiftKey = false;

  $: if (hasGroup) {
    if (value !== prevValue) {
      remove(prevValue);
      unregister();
      unregister = register(value);
      add({ value, selected });
      prevValue = value;
    }
    selected = $selectedValues.includes(value);
  }

  // A form reset restores the checkbox without a change event. Sync the
  // state to it and fire no `select`/`deselect`, like the other form
  // controls. In a group, `add`/`remove` update membership silently.
  function handleFormReset() {
    if (!ref) return;
    const nextSelected = ref.checked;
    if (hasGroup) {
      if (nextSelected) add({ value, selected: true });
      else remove(value);
    } else {
      selected = nextSelected;
    }
  }
</script>

<input
  bind:this={ref}
  use:formReset={handleFormReset}
  type="checkbox"
  tabindex={disabled ? undefined : tabindex}
  class:bx--tile-input={true}
  checked={selected}
  {id}
  {value}
  name={$groupName ?? name}
  {title}
  {disabled}
  aria-describedby={ariaDescribedBy}
  aria-labelledby={ariaLabelledBy}
  on:click={(event) => {
    pendingShiftKey = event.shiftKey;
  }}
  on:change={() => {
    if (disabled) return;
    if (!ref) return;
    const newSelected = ref.checked;
    selected = newSelected;
    if (hasGroup) {
      update({ value, selected: newSelected, shiftKey: pendingShiftKey });
    } else {
      if (newSelected) {
        dispatch("select", id);
      } else {
        dispatch("deselect", id);
      }
    }
    pendingShiftKey = false;
  }}
  on:change
  on:keydown
  on:keydown={(event) => {
    if (disabled) return;
    if (event.key === "Enter") {
      event.preventDefault();
      // Toggle once per press, like Space; a held key would otherwise
      // toggle on every auto-repeat.
      if (event.repeat) return;
      // Dispatching (rather than `ref.click()`) lets Shift be forwarded onto
      // the resulting click, which still runs the checkbox's native
      // pre-click activation (toggle + a follow-up "change").
      ref.dispatchEvent(
        new MouseEvent("click", {
          shiftKey: event.shiftKey,
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  }}
>
<label
  for={id}
  class:bx--tile={true}
  class:bx--tile--selectable={true}
  class:bx--tile--is-selected={selected}
  class:bx--tile--light={light}
  class:bx--tile--disabled={disabled || $groupDisabled}
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
