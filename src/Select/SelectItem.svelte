<script>
  /**
   * Specify the option value
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Specify the option text
   * @type {string} [text=""]
   */
  export let text = "";

  /**
   * Set to `true` to hide the option
   * @type {boolean} [hidden=false]
   */
  export let hidden = false;

  /**
   * Set to `true` to disable the option
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  import { getContext, onDestroy } from "svelte";

  const ctx = getContext("Select") || getContext("TimePickerSelect");

  let selected = false;

  const unsubscribe = ctx.selectedValue.subscribe(($) => {
    selected = $ === value;
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<option
  {value}
  {disabled}
  {hidden}
  {selected}
  class:bx--select-option={true}
  class={$$restProps.class}
  style={$$restProps.style}>
  {text || value}
</option>
