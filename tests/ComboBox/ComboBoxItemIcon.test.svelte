<script lang="ts">
  import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  const items: ComboBoxItem[] = [
    { id: "0", text: "With icon", icon: Edit },
    { id: "1", text: "No icon" },
  ];
</script>

<ComboBox
  {items}
  selectedId="0"
  open
  labelText="Item icons"
  let:item
  let:selected
  let:highlighted
>
  <span
    data-testid="item-{item.id}"
    data-selected={selected}
    data-highlighted={highlighted}
  >
    {item.text}
  </span>
</ComboBox>
