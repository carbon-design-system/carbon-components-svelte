<script>
  export let disabled = false;
  export let hidden = false;
  export let text = "";
  export let value = "";

  import { getContext, onDestroy } from "svelte";

  const ctx = getContext("Select") || getContext("TimePickerSelect");

  let selected = false;

  const unsubscribe = ctx.selectedValue.subscribe($ => {
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
