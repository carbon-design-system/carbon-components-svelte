<script lang="ts">
  import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";

  const items: DropdownItem[] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
  ];
</script>

<Dropdown {items} selectedId="0" open labelText="Icon slots">
  <svelte:fragment slot="icon" let:item>
    <span data-testid="left-{item.id}">L</span>
  </svelte:fragment>
  <svelte:fragment slot="iconRight" let:item let:selected>
    <span data-testid="right-{item.id}" data-selected={selected}>R</span>
  </svelte:fragment>
</Dropdown>
