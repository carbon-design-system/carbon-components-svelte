<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  export let selectedId: string | undefined = undefined;
  export let value = "";
  export let readonly = false;
  export let allowCustomValue = false;
  export let onSelect: (event: CustomEvent) => void = () => {};

  const items = [
    { id: "apple", text: "Apple" },
    { id: "banana", text: "Banana" },
  ];
</script>

<form data-testid="form">
  <ComboBox
    bind:selectedId
    bind:value
    {readonly}
    {allowCustomValue}
    {items}
    name="fruit"
    labelText="Fruit"
    on:select={onSelect}
  />
</form>
<p data-testid="bound">{selectedId ?? "none"}|{value}</p>
