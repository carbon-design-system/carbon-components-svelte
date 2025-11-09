<script lang="ts">
  import { ComboBox } from "carbon-components-svelte";
  import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  let comboBoxRef: ComboBox;

  export let items: ComboBoxItem[] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax", disabled: true },
  ];
  export let selectedId: string | undefined = undefined;
  export let direction: "top" | "bottom" = "bottom";
  export let clearOptions: { focus?: boolean } = {};
  export let shouldFilterItem = (item: ComboBoxItem, value: string) =>
    item.text.toLowerCase().includes(value.toLowerCase());
  export let itemToString = (item: ComboBoxItem) => item.text;
</script>

<ComboBox
  bind:this={comboBoxRef}
  {items}
  {selectedId}
  {direction}
  {shouldFilterItem}
  {itemToString}
  labelText="Contact with icons"
  placeholder="Select contact method"
  on:select={(e) => {
    console.log("select", e.detail);
  }}
  let:item
>
  <span>Item {item.text}</span>
</ComboBox>

<button type="button" on:click={() => comboBoxRef.clear(clearOptions)}>
  Clear
</button>
