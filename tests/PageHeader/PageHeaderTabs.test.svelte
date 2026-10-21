<script lang="ts">
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let show = true;
  export let type: "default" | "container" = "default";
</script>

<PageHeader data-testid="header" title="Databases">
  <svelte:fragment slot="tabs">
    {#if show}
      <Tabs {type}>
        <Tab label="Overview" />
        <Tab label="Backups" />
      </Tabs>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="tabsEnd">
    <button type="button">Last 24 hours</button>
  </svelte:fragment>
  {#if show}
    <TabContent data-testid="overview">
      Overview panel
      <Tabs>
        <Tab label="Daily" />
        <Tab label="Weekly" />
        <svelte:fragment slot="content">
          <TabContent>Daily panel</TabContent>
          <TabContent>Weekly panel</TabContent>
        </svelte:fragment>
      </Tabs>
    </TabContent>
    <TabContent data-testid="backups">Backups panel</TabContent>
  {/if}
</PageHeader>
