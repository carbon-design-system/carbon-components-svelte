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
   * Specify the themes for the off and on states.
   * @type {[off: import("./theme-labels.js").CarbonTheme, on: import("./theme-labels.js").CarbonTheme]}
   */
  export let themes = ["white", "g100"];

  /** Specify the label text */
  export let labelText = "Dark mode";

  /**
   * Specify the toggle size.
   * @type {import("../Toggle/Toggle.svelte").ToggleProps["size"]}
   */
  export let size = "default";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the text beside the switch while it's off */
  export let labelA = "";

  /** Specify the text beside the switch while it's on */
  export let labelB = "";

  /** Set to `true` to disable the toggle */
  export let disabled = false;

  import Toggle from "../Toggle/Toggle.svelte";
</script>

<Toggle
  {size}
  {hideLabel}
  {labelA}
  {labelB}
  {disabled}
  {labelText}
  {...$$restProps}
  toggled={theme === themes[1]}
  on:toggle={(event) => {
    theme = event.detail.toggled ? themes[1] : themes[0];
  }}
/>
