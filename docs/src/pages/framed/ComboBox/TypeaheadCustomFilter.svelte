<script>
  import { ComboBox } from "carbon-components-svelte";

  let selectedId = undefined;

  /**
   * Simple fuzzy filter: each character in the query
   * must appear in order within the item text.
   * e.g., "bl" matches "Blueberry" and "Blackberry".
   */
  function shouldFilterItem(item, value) {
    if (!value) return true;
    const text = item.text.toLowerCase();
    let j = 0;
    for (const char of value.toLowerCase()) {
      j = text.indexOf(char, j);
      if (j === -1) return false;
      j++;
    }
    return true;
  }
</script>

<ComboBox
  labelText="Item"
  placeholder="Select an item"
  bind:selectedId
  typeahead
  {shouldFilterItem}
  items={[
    { id: "0", text: "Apple" },
    { id: "1", text: "Apricot" },
    { id: "2", text: "Banana" },
    { id: "3", text: "Blueberry" },
    { id: "4", text: "Blackberry" },
    { id: "5", text: "Cherry" },
    { id: "6", text: "Cranberry" },
    { id: "7", text: "Grape" },
    { id: "8", text: "Mango" },
    { id: "9", text: "Pineapple" },
  ]}
/>
