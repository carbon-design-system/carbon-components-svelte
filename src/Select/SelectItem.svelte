<script>
  /**
   * Specify the option value.
   * @type {string | number}
   */
  export let value = "";

  /**
   * Specify the option text.
   * If not specified, the value will be used as the text.
   * @type {string}
   */
  export let text = undefined;

  /** Set to `true` to hide the option */
  export let hidden = false;

  /** Set to `true` to disable the option */
  export let disabled = false;

  let className = undefined;

  /**
   * Specify the class of the `option` element.
   * @type {string}
   */
  export { className as class };

  /**
   * Specify the style of the `option` element.
   * @type {string}
   */
  export let style = undefined;

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
  {value}
  {disabled}
  {hidden}
  {selected}
  class:bx--select-option={true}
  class={className}
  {style}
>
  {text ?? value}
</option>
