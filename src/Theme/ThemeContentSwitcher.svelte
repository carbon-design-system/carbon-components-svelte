<script>
  /**
   * @restProps {div}
   */

  /**
   * Set the current Carbon theme. Bind it to `Theme`'s `theme`.
   * @type {import("./theme-labels.js").CarbonTheme}
   * @bindable writable
   */
  export let theme = "white";

  /**
   * Specify the themes to show, in order.
   * @type {import("./theme-labels.js").CarbonTheme[]}
   */
  export let themes = ["white", "g10", "g80", "g90", "g100"];

  /** Specify the label text */
  export let labelText = "Themes";

  /**
   * Specify the content switcher size.
   * @type {import("../ContentSwitcher/ContentSwitcher.svelte").ContentSwitcherProps["size"]}
   */
  export let size = undefined;

  /**
   * Set to `true` to size each switch to its label instead of splitting the
   * width evenly.
   */
  export let autoWidth = false;

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to disable every switch */
  export let disabled = false;

  import ContentSwitcher from "../ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "../ContentSwitcher/Switch.svelte";
  import { useId } from "../utils/id-scope.js";
  import { themeLabels } from "./theme-labels.js";

  // The switch ids derive from it.
  const id = $$restProps.id || useId("theme-content-switcher");

  // The server renders switches in order, so one before the selected switch
  // would also render selected unless the first index points at it. Passed
  // once: an index that follows `theme` gets clamped when `theme` isn't
  // listed, and the switcher would report that as a change.
  const initialIndex = Math.max(themes.indexOf(theme), 0);

  /** @param {CustomEvent<number>} event */
  function handleChange(event) {
    // A `theme` that isn't in `themes` selects nothing new, so this only
    // runs for a pick, or for a listed `theme` set from outside, which
    // writes the same value back.
    theme = themes[event.detail] ?? theme;
  }
</script>

<ContentSwitcher
  {labelText}
  {hideLabel}
  {size}
  {autoWidth}
  selectedIndex={initialIndex}
  {...$$restProps}
  {id}
  on:change={handleChange}
>
  <!-- While `theme` is unlisted, the last switch stays selected, and a click
       on it is no change to the switcher, so it sets `theme` itself. -->
  {#each themes as option (option)}
    <Switch
      id="{id}-{option}"
      text={themeLabels[option]}
      selected={option === theme}
      {disabled}
      on:click={() => {
        theme = option;
      }}
    />
  {/each}
</ContentSwitcher>
