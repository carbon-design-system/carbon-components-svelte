<script lang="ts">
  import {
    Button,
    Content,
    Header,
    MultiAddSelect,
    SidePanel,
    Stack,
    Tag,
  } from "carbon-components-svelte";
  import {
    buildCatalog,
    catalogFilters,
    type CatalogItem,
    createCatalogSource,
  } from "../../../add-select-catalog";

  const source = createCatalogSource(buildCatalog(), { latency: 250 });

  let open = true;
  let value: (string | number)[] = [];
  let attached: CatalogItem[] = [];
</script>

<Header companyName="IBM" platformName="Data catalog" />
<Content>
  <Stack gap={5}>
    <Button on:click={() => (open = true)}>Attach datasets</Button>
    {#if attached.length > 0}
      <Stack gap={3} orientation="horizontal">
        {#each attached as dataset (dataset.id)}
          <Tag>{dataset.title}</Tag>
        {/each}
      </Stack>
    {/if}
  </Stack>
</Content>

<SidePanel
  bind:open
  size="2xl"
  includeOverlay
  labelText="Project Atlas"
  title="Attach datasets"
  subtitle="Search 10,000 datasets, open a schema and choose from any level."
>
  <MultiAddSelect
    bind:value
    {source}
    filters={catalogFilters}
    labelText="Datasets"
    rootText="Catalog"
    confirmCountText={(count) => `Attach ${count}`}
    on:confirm={(event) => {
      attached = event.detail.items;
      open = false;
    }}
    on:cancel={() => (open = false)}
  />
</SidePanel>
