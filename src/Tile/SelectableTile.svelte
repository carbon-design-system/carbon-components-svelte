<script>
  /**
   * @restProps {label}
   * @event {string} "select"
   * @event {string} "deselect"
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

  /** Specify the value of the selectable tile */
  export let value = "value";

  /**
   * Specify the tabindex
   * @type {number | string | undefined}
   */
  export let tabindex = "0";

  /** Specify the ARIA label for the selectable tile checkmark icon */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = "";

  /**
   * Specify the id of a form element outside the component to associate
   * the checkbox with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import { readable } from "svelte/store";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { noop } from "../utils/noop.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  const ctx = getContext("carbon:SelectableTileGroup");
  const hasGroup = ctx !== undefined;
  const add = ctx?.add ?? noop;
  const remove = ctx?.remove ?? noop;
  const update = ctx?.update ?? noop;
  const selectedValues = ctx?.selectedValues ?? readable([]);
  const groupName = ctx?.groupName ?? readable(undefined);
  const groupForm = ctx?.groupForm ?? readable(undefined);

  add({ value, selected });

  let prevValue = value;

  // Captured from the checkbox's `click` event, which fires before `change`,
  // so the group's `update` knows whether Shift was held for range selection.
  let pendingShiftKey = false;

  $: if (hasGroup) {
    if (value !== prevValue) {
      remove(prevValue);
      add({ value, selected });
      prevValue = value;
    }
    selected = $selectedValues.includes(value);
  }

  // Naming and description belong on the input, not the label.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: labelProps,
  } = splitAriaNaming($$restProps));
</script>

<input
  bind:this={ref}
  type="checkbox"
  tabindex={disabled ? undefined : tabindex}
  class:bx--tile-input={true}
  checked={selected}
  {id}
  {value}
  name={$groupName ?? name}
  form={$groupForm ?? form}
  {title}
  {disabled}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledBy}
  aria-describedby={ariaDescribedBy}
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
  on:keydown
  on:keydown={(event) => {
    if (disabled) return;
    if (event.key === "Enter") {
      event.preventDefault();
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
  class:bx--tile--disabled={disabled}
  class:bx--tile--full-height={fullHeight}
  {...labelProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span aria-hidden="true" class:bx--tile__checkmark={true}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      width="16"
      height="16"
      aria-hidden={iconDescription || iconDescription ? undefined : true}
      role={iconDescription || iconDescription ? "img" : undefined}
      aria-label={iconDescription}
    >
      {#if iconDescription}
        <title>{iconDescription}</title>
      {/if}
      <path
        d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2ZM14,21.5908l-5-5L10.5906,15,14,18.4092,21.41,11l1.5957,1.5859Z"
      ></path>
      <path
        fill="none"
        d="M14 21.591L9 16.591 10.591 15 14 18.409 21.41 11 23.005 12.585 14 21.591z"
        data-icon-path="inner-path"
      ></path>
    </svg>
  </span>
  <span class:bx--tile-content={true}> <slot /> </span>
</label>
