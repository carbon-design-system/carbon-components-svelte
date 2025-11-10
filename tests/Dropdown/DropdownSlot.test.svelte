<script lang="ts">
  import { Dropdown } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [
    { id: "0", text: "Option 1" },
    { id: "1", text: "Option 2" },
    { id: "2", text: "Option 3" },
  ];
  export let selectedId: ComponentProps<Dropdown>["selectedId"] = "0";
  export let id: ComponentProps<Dropdown>["id"] = "test-dropdown-slot";
</script>

<Dropdown
  {items}
  {selectedId}
  {id}
  labelText="Custom slot dropdown"
  let:item
  let:index
>
  <span data-testid="custom-item">
    Item {index + 1}: {item.text}
  </span>
</Dropdown>
