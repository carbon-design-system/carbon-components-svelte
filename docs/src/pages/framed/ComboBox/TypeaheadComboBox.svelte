<script>
  import { Button, ComboBox } from "carbon-components-svelte";

  let selectedId = undefined;
</script>

<ComboBox
  labelText="Item"
  placeholder="Select an item"
  bind:selectedId
  typeahead
  items={[
  {id: "0", text: "Apple"},
  {id: "1", text: "Apricot"},
  {id: "2", text: "Banana"},
  {id: "3", text: "Blueberry"},
  {id: "4", text: "Blackberry"},
  {id: "5", text: "Cherry"},
  {id: "6", text: "Cranberry"},
  {id: "7", text: "Grape"},
  {id: "8", text: "Mango"},
  {id: "9", text: "Pineapple"},
  ]}
/>
<br>
<Button on:click={() => (selectedId = undefined)}>
  Set to undefined (unselected)
</Button>
