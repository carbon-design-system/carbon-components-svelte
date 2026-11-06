<script lang="ts">
  import { AddSelect, Button, Modal } from "carbon-components-svelte";
  import {
    buildCatalog,
    type CatalogItem,
    createCatalogSource,
  } from "../../../add-select-catalog";

  const source = createCatalogSource(buildCatalog(), { latency: 200 });

  let open = false;
  let value: string | number | null = null;
  let chosen: CatalogItem | undefined;
</script>

<Button on:click={() => (open = true)}>Choose a source dataset</Button>
{#if chosen}
  <p>Source: {chosen.title}</p>
{/if}

<Modal
  bind:open
  passiveModal
  size="lg"
  modalHeading="Choose a source dataset"
  on:close={() => (open = false)}
>
  <AddSelect
    bind:value
    {source}
    labelText="Datasets"
    rootText="Catalog"
    confirmText="Use dataset"
    on:confirm={(event) => {
      chosen = event.detail.items[0];
      open = false;
    }}
    on:cancel={() => (open = false)}
  />
</Modal>
