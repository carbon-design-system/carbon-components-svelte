<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<ComboBox>["items"] = [
    { id: "0", text: "Option 1" },
    { id: "1", text: "Option 2" },
    { id: "2", text: "Option 3" },
  ];
  export let selectedId: ComponentProps<ComboBox>["selectedId"] = undefined;
</script>

<ComboBox
  {items}
  {selectedId}
  labelText="Custom slot combobox"
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
</ComboBox>
