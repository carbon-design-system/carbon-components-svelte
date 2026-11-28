<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let shown = false;
</script>

<PageHeader data-testid="header" title="Databases">
  <svelte:fragment slot="breadcrumb">
    {#if shown}
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#home">Home</BreadcrumbItem>
      </Breadcrumb>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tabs">
    {#if shown}
      <Tabs>
        <Tab label="Overview" />
      </Tabs>
    {/if}
  </svelte:fragment>
</PageHeader>
