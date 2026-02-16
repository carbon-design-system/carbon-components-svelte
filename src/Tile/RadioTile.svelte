<script>
  /**
   * @restProps {label}
   * @generics {Value extends string = string} Value
   * @template {string} Value
   */

  /** Set to `true` to check the tile */
  export let checked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /**
   * Specify the value of the radio input.
   * @type {Value}
   */
  export let value = "";

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Specify the ARIA label for the radio tile checkmark icon */
  export let iconDescription = "Tile checkmark";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the radio tile input.
   * @type {string}
   */
  export let name = undefined;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";

  // aria attributes should go to the input element, not the label.
  $: ariaDescribedBy = $$restProps["aria-describedby"];
  $: ariaLabelledBy = $$restProps["aria-labelledby"];
  $: labelRestProps = Object.fromEntries(
    Object.entries($$restProps).filter(
      ([key]) => key !== "aria-describedby" && key !== "aria-labelledby",
    ),
  );

  const { add, update, selectedValue, groupName, groupRequired } = getContext(
    "TileGroup",
  ) ?? {
    add: () => {},
    groupName: readable(undefined),
    groupRequired: readable(undefined),
    selectedValue: readable(checked ? value : undefined),
  };

  add({ value, checked });

  $: checked = value === $selectedValue;
</script>

<input
  type="radio"
  {id}
  name={$groupName ?? name}
  {value}
  {checked}
  tabindex={disabled ? undefined : tabindex}
  {disabled}
  required={$groupRequired ?? required}
  aria-describedby={ariaDescribedBy}
  aria-labelledby={ariaLabelledBy}
  class:bx--tile-input={true}
  on:change
  on:change={() => {
    if (disabled) return;
    update(value);
  }}
  on:keydown
  on:keydown={(e) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      update(value);
    }
  }}
/>
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<label
  for={id}
  class:bx--tile={true}
  class:bx--tile--selectable={true}
  class:bx--tile--is-selected={checked}
  class:bx--tile--light={light}
  class:bx--tile--disabled={disabled}
  {...labelRestProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <span class:bx--tile__checkmark={true}>
    <CheckmarkFilled aria-label={iconDescription} title={iconDescription} />
  </span>
  <span class:bx--tile-content={true}>
    <slot />
  </span>
</label>
