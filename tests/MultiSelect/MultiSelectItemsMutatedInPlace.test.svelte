<script lang="ts">
  import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";

  let items: MultiSelectItem[] = [
    { id: "b", text: "Bravo" },
    { id: "c", text: "Charlie" },
  ];
</script>

<button
  type="button"
  on:click={() => {
    items.push({ id: "a", text: "Alpha" });
    items = items;
  }}
>
  Add item in place
</button>

<MultiSelect labelText="Contact" {items} />
