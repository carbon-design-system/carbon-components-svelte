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
   * Specify the themes to list, in order.
   * @type {import("./theme-labels.js").CarbonTheme[]}
   */
  export let themes = ["white", "g10", "g80", "g90", "g100"];

  /** Specify the label text */
  export let labelText = "Themes";

  /**
   * Specify the dropdown type.
   * @type {import("../Dropdown/Dropdown.svelte").DropdownProps["type"]}
   */
  export let type = "default";

  /**
   * Specify the dropdown size.
   * @type {import("../Dropdown/Dropdown.svelte").DropdownProps["size"]}
   */
  export let size = undefined;

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  import Dropdown from "../Dropdown/Dropdown.svelte";
  import { themeLabels } from "./theme-labels.js";
</script>

<Dropdown
  {type}
  {size}
  {hideLabel}
  {disabled}
  {labelText}
  {...$$restProps}
  items={themes.map((id) => ({ id, text: themeLabels[id] }))}
  selectedId={theme}
  on:select={(event) => {
    theme = event.detail.selectedId;
  }}
/>
