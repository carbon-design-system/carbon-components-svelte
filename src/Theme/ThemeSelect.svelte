<script>
  /**
   * @restProps {select}
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
   * Specify the select size.
   * @type {import("../Select/Select.svelte").SelectProps<any>["size"]}
   */
  export let size = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to disable the select */
  export let disabled = false;

  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import { themeLabels } from "./theme-labels.js";
</script>

<Select
  {labelText}
  {size}
  {inline}
  {hideLabel}
  {disabled}
  {...$$restProps}
  bind:selected={theme}
>
  {#each themes as option (option)}
    <SelectItem value={option} text={themeLabels[option]} />
  {/each}
</Select>
