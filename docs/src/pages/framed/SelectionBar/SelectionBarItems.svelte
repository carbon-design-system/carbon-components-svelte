<script>
  import {
    Button,
    Checkbox,
    SelectionBar,
    Stack,
    Tag,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";

  const regions = [
    { id: "us-east", name: "US East" },
    { id: "eu-de", name: "Frankfurt" },
    { id: "jp-tok", name: "Tokyo" },
    { id: "au-syd", name: "Sydney" },
  ];

  let selectedIds = ["us-east", "jp-tok"];

  $: selected = regions.filter((region) => selectedIds.includes(region.id));

  function toggle(id, checked) {
    selectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
  }
</script>

<Stack gap={5}>
  <SelectionBar count={selectedIds.length} on:clear={() => (selectedIds = [])}>
    <svelte:fragment slot="actions">
      <Button icon={Download}>Export usage</Button>
    </svelte:fragment>
    <svelte:fragment slot="items">
      {#each selected as region (region.id)}
        <Tag filter on:close={() => toggle(region.id, false)}>{region.name}</Tag
        >
      {/each}
    </svelte:fragment>
  </SelectionBar>
  <fieldset>
    <legend class="bx--label">Regions</legend>
    {#each regions as region (region.id)}
      <Checkbox
        labelText={region.name}
        checked={selectedIds.includes(region.id)}
        on:check={(event) => toggle(region.id, event.detail)}
      />
    {/each}
  </fieldset>
</Stack>
