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

  const groupedItems = [
    { id: "global", text: "Global edge network" },
    { id: "us-east-1", text: "US East (N. Virginia)", group: "Americas" },
    { id: "eu-west-1", text: "Europe (Ireland)", group: "Europe" },
    { id: "us-west-2", text: "US West (Oregon)", group: "Americas" },
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
  data-testid="multiselect-contact"
  labelText="Contact"
  label="Choose contact methods"
  items={[
    { id: "email", text: "Email" },
    { id: "slack", text: "Slack" },
  ]}
/>

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

<div data-testid="multiselect-fluid-neutral">
  <MultiSelect
    fluid
    data-testid="multiselect-fluid-neutral-select"
    labelText="Produce"
    label="Choose produce"
    {items}
    filterable={true}
    placeholder="Filter produce"
  />
</div>

<div data-testid="multiselect-grouped">
  <MultiSelect
    data-testid="multiselect-regions"
    labelText="Regions"
    label="Choose regions"
    items={groupedItems}
    filterable={true}
    placeholder="Filter regions"
  />
</div>
