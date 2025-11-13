<script>
  import { Button, ComboBox } from "carbon-components-svelte";

  let selectedId = undefined;

  const items = [
    "Apple",
    "Apricot",
    "Avocado",
    "Banana",
    "Blackberry",
    "Blueberry",
    "Cantaloupe"
  ].map(item => ({ id: item, text: item}));
</script>

<ComboBox
  labelText="Item"
  placeholder="Select an item"
  bind:selectedId
  typeahead
  {items}
/>
<br />
<Button on:click={() => (selectedId = undefined)}
  >Set to undefined (unselected)</Button
>
