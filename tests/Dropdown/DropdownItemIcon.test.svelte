<script lang="ts">
  import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  const items: DropdownItem[] = [
    { id: "0", text: "With icon", icon: Edit },
    { id: "1", text: "No icon" },
  ];
</script>

<Dropdown
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
</Dropdown>
