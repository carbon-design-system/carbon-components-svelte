<script lang="ts">
  import {
    BigNumber,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    DataTable,
    EmptyState,
    PageHeader,
    SearchMenu,
    SearchMenuGroup,
    SearchMenuItem,
    Tab,
    Tabs,
  } from "carbon-components-svelte";

  // Each slot below is passed, but its content is conditional and off, as
  // a consumer's `{#if}` would leave it. `?shown` fills them.
  const shown = new URLSearchParams(location.search).has("shown");
</script>

<EmptyState titleText="No projects" data-testid="empty-state">
  <svelte:fragment slot="illustration">
    {#if shown}<span>Illustration</span>{/if}
  </svelte:fragment>
  {#if shown}<Button>Create project</Button>{/if}
</EmptyState>

<BigNumber labelText="Requests" value={1200} data-testid="big-number">
  <svelte:fragment slot="action">
    {#if shown}<Button>Details</Button>{/if}
  </svelte:fragment>
  {#if shown}<span>Updated today</span>{/if}
</BigNumber>

<PageHeader title="Projects" data-testid="page-header">
  <svelte:fragment slot="breadcrumb">
    {#if shown}
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#home">Home</BreadcrumbItem>
      </Breadcrumb>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="titleStart">
    {#if shown}<span>Start</span>{/if}
  </svelte:fragment>
  <svelte:fragment slot="titleEnd">
    {#if shown}<span>End</span>{/if}
  </svelte:fragment>
  <svelte:fragment slot="description">
    {#if shown}<p>Description</p>{/if}
  </svelte:fragment>
  <svelte:fragment slot="meta">
    {#if shown}<span>Meta</span>{/if}
  </svelte:fragment>
  <svelte:fragment slot="tabs">
    {#if shown}
      <Tabs>
        <Tab label="Overview" />
      </Tabs>
    {/if}
  </svelte:fragment>
</PageHeader>

<PageHeader title="Reports" data-testid="page-header-tabs-end">
  <Tabs slot="tabs">
    <Tab label="Overview" />
  </Tabs>
  <svelte:fragment slot="tabsEnd">
    {#if shown}<Button size="small">Export</Button>{/if}
  </svelte:fragment>
</PageHeader>

<DataTable
  expandable
  expandedRowIds={["a"]}
  headers={[{ key: "name", value: "Name" }]}
  rows={[{ id: "a", name: "Load balancer" }]}
  data-testid="data-table"
>
  <svelte:fragment slot="expandedRow">
    {#if shown}<p>Details</p>{/if}
  </svelte:fragment>
</DataTable>

<div class="search-menu" data-testid="search-menu">
  <SearchMenu portal={false} labelText="Search" placeholder="Search">
    <SearchMenuGroup label="Recent searches" filter={false}>
      <svelte:fragment slot="action">
        {#if shown}<Button kind="ghost" size="small">Clear</Button>{/if}
      </svelte:fragment>
      <SearchMenuItem text="Load balancer" />
    </SearchMenuGroup>
  </SearchMenu>
</div>

<style>
  .search-menu {
    min-height: 12rem;
  }
</style>
