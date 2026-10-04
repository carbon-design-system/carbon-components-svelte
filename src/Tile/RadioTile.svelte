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

  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
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
  const update = ctx?.update ?? noop;
  const selectedValue =
    ctx?.selectedValue ?? readable(checked ? value : undefined);
  const groupName = ctx?.groupName ?? readable(undefined);
  const fallbackName = ctx?.fallbackName;
  const groupRequired = ctx?.groupRequired ?? readable(undefined);

  add({ value, checked });

  // The `checked` this tile last derived from the group. A different
  // `checked` on the next run was written from outside, so push it into the
  // group instead of overwriting it. One block, so the comparison always
  // sees the write before the re-derive.
  let syncedChecked = checked;

  $: if (ctx) {
    if (checked !== syncedChecked) {
      if (checked) selectedValue.set(value);
      else if ($selectedValue === value) selectedValue.set(undefined);
    }
    const derived = value === $selectedValue;
    // Write only on change: under Svelte 5, every write to a prop bound to
    // an array item (`bind:checked={a[i]}`) re-runs this block in every tile.
    if (checked !== derived) checked = derived;
    syncedChecked = derived;
  }
</script>

<input
  type="radio"
  {id}
  name={$groupName ?? (name || fallbackName)}
  {value}
  {checked}
  tabindex={disabled ? undefined : tabindex}
  {disabled}
  required={$groupRequired ?? required}
  aria-describedby={ariaDescribedBy}
  aria-labelledby={ariaLabelledBy}
  class:bx--tile-input={true}
  on:change
  on:change={() => update(value)}
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
  class:bx--tile--disabled={disabled}
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
