<script lang="ts">
  import { MultiSelect } from "carbon-components-svelte";

  /** itemToString may return Item["id"] (e.g. number), matching default `text ?? id`. */
  const items = [
    { id: 101, text: "SKU label A" },
    { id: 102, text: "SKU label B" },
  ];
</script>

<MultiSelect
  {items}
  itemToString={(item) => item.id}
  label="Choose SKU"
  labelText="SKU"
  on:select={() => {}}
/>
