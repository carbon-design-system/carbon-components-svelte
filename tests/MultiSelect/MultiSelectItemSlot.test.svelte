<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [
    { id: "0", text: "Option 1" },
    { id: "1", text: "Option 2" },
    { id: "2", text: "Option 3" },
  ];
  export let selectedIds: ComponentProps<MultiSelect>["selectedIds"] = [];
</script>

<MultiSelect
  {items}
  {selectedIds}
  labelText="Custom slot multiselect"
  label="Select items"
  let:item
  let:index
  let:selected
  let:highlighted
>
  <span
    data-testid="custom-item"
    data-selected={selected}
    data-highlighted={highlighted}
  >
    Item {index + 1}: {item.text}
  </span>
</MultiSelect>
