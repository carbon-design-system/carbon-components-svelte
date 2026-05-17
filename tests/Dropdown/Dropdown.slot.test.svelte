<script lang="ts">
  import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  const items: DropdownItem[] = [
    { id: "0", text: "Option 1" },
    { id: "1", text: "Option 2" },
  ];
</script>

<Dropdown {items} selectedId="0" labelText="Default label">
  <span slot="labelChildren">Custom label content</span>
</Dropdown>
