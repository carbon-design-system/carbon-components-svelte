<script>
  import {
    Button,
    Checkbox,
    SelectionBar,
    Stack,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const services = [
    { id: "api-gateway", name: "API gateway" },
    { id: "billing", name: "Billing" },
    { id: "search-index", name: "Search index" },
    { id: "audit-log", name: "Audit log" },
  ];

  let selectedIds = ["billing"];

  function toggle(id, checked) {
    selectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
  }
</script>

<Stack gap={5}>
  <SelectionBar count={selectedIds.length} on:clear={() => (selectedIds = [])}>
    <svelte:fragment slot="actions">
      <Button icon={Download}>Download</Button>
      <Button icon={TrashCan}>Delete</Button>
    </svelte:fragment>
  </SelectionBar>
  <fieldset>
    <legend class="bx--label">Services</legend>
    {#each services as service (service.id)}
      <Checkbox
        labelText={service.name}
        checked={selectedIds.includes(service.id)}
        on:check={(event) => toggle(service.id, event.detail)}
      />
    {/each}
  </fieldset>
</Stack>
