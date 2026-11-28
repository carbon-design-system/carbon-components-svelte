<script lang="ts">
  import {
    Button,
    Checkbox,
    SelectionBar,
    Tag,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const services = [
    { id: "api-gateway", name: "API gateway" },
    { id: "billing", name: "Billing" },
    { id: "search-index", name: "Search index" },
    { id: "audit-log", name: "Audit log" },
  ];

  const params = new URLSearchParams(location.search);
  const placement = params.has("pinned") ? "viewport-end" : "content";
  const transition = params.has("animated");
  // The items slot renders nothing, as a conditional notice does.
  const emptyItems = params.has("empty-items");

  let selectedIds = ["api-gateway", "billing"];
  let clears = 0;

  $: selected = emptyItems
    ? []
    : services.filter((service) => selectedIds.includes(service.id));

  function toggle(id: string, checked: boolean) {
    selectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
  }
</script>

<div class="page">
  <SelectionBar
    count={selectedIds.length}
    {placement}
    {transition}
    data-testid="bar"
    on:clear={() => {
      clears += 1;
      selectedIds = [];
    }}
  >
    <svelte:fragment slot="actions">
      <Button icon={Download}>Download</Button>
      <Button icon={TrashCan}>Delete</Button>
    </svelte:fragment>
    <svelte:fragment slot="items">
      {#each selected as service (service.id)}
        <Tag filter on:close={() => toggle(service.id, false)}
          >{service.name}</Tag
        >
      {/each}
    </svelte:fragment>
  </SelectionBar>

  <fieldset data-testid="services">
    <legend>Services</legend>
    {#each services as service (service.id)}
      <Checkbox
        labelText={service.name}
        checked={selectedIds.includes(service.id)}
        on:check={(event) => toggle(service.id, event.detail)}
      />
    {/each}
  </fieldset>
  <p data-testid="clears">{clears}</p>
</div>

<style>
  .page {
    padding-bottom: 8rem;
  }
</style>
