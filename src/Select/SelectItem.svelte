<script>
  /**
   * @template {string | number} [Value=string | number]
   */

  /**
   * Specify the option value.
   * @type {Value}
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
  import { uniqueId } from "../utils/unique-id.js";

  const id = uniqueId();
  const ctx =
    getContext("carbon:Select") || getContext("carbon:TimePickerSelect");

  $: {
    ctx?.setDefaultValue?.(id, value);
    ctx?.syncNativeSelectValue?.();
  }

  let selected = false;

  const unsubscribe = ctx.selectedValue.subscribe((currentValue) => {
    selected = currentValue === value;
  });

  onMount(() => {
    return () => {
      unsubscribe();
      ctx?.syncNativeSelectValue?.();
    };
  });

  /**
   * Keep the `selected` attribute on the current choice, so a form reset
   * leaves the selection alone. Svelte 5 already renders `selected` as the
   * attribute; Svelte 3 and 4 only set the property, so a reset jumped to
   * the first option while the bound value stayed.
   * @type {(node: HTMLOptionElement, isSelected: boolean) => { update: (isSelected: boolean) => void }}
   */
  function reflectSelected(node, isSelected) {
    node.defaultSelected = isSelected;
    return {
      update(next) {
        node.defaultSelected = next;
      },
    };
  }
</script>

<option
  use:reflectSelected={selected}
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
