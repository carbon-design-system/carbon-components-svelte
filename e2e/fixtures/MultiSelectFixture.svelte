<script>
  import { MultiSelect } from "carbon-components-svelte";

  const items = [
    { id: "apple", text: "Apple" },
    { id: "banana", text: "Banana" },
    { id: "cherry", text: "Cherry" },
    { id: "date", text: "Date" },
    { id: "elderberry", text: "Elderberry" },
  ];

  const itemsWithSelectAll = [
    { id: "select-all", text: "All roles", isSelectAll: true },
    { id: "editor", text: "Editor" },
    { id: "owner", text: "Owner" },
    { id: "uploader", text: "Uploader" },
    { id: "reader", text: "Reader", disabled: true },
  ];

  let selectedIds = [];
  let selectedRoleIds = [];
</script>

<MultiSelect
  data-testid="multiselect-fruits"
  labelText="Fruits"
  label="Choose fruits"
  {items}
  bind:selectedIds
  filterable={true}
  placeholder="Filter fruits"
/>

{#if selectedIds.length > 0}
  <p data-testid="selected-count">Selected: {selectedIds.length}</p>
{/if}

<MultiSelect
  data-testid="multiselect-roles"
  labelText="Roles"
  label="Choose roles"
  items={itemsWithSelectAll}
  bind:selectedIds={selectedRoleIds}
  filterable={true}
  placeholder="Filter roles..."
/>

{#if selectedRoleIds.length > 0}
  <p data-testid="selected-roles-count">
    Selected roles: {selectedRoleIds.length}
  </p>
{/if}
