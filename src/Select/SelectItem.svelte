<script>
  /**
   * Specify the option value
   * @type {string | number}
   */
  export let value = "";

  /** Specify the option text */
  export let text = "";

  /** Set to `true` to hide the option */
  export let hidden = false;

  /** Set to `true` to disable the option */
  export let disabled = false;

  import { getContext, onMount } from "svelte";

  const id = "ccs-" + Math.random().toString(36);
  const ctx = getContext("Select") || getContext("TimePickerSelect");

  $: ctx?.setDefaultValue?.(id, value);

  let selected = false;

  const unsubscribe = ctx.selectedValue.subscribe((currentValue) => {
    selected = currentValue === value;
  });

  onMount(() => {
    return () => unsubscribe();
  });
</script>

<option
  value="{value}"
  disabled="{disabled}"
  hidden="{hidden}"
  selected="{selected}"
  class:bx--select-option="{true}"
  class="{$$restProps.class}"
  style="{$$restProps.style}"
>
  {text || value}
</option>
