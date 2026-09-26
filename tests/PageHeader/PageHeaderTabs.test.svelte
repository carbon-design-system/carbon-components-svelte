<script lang="ts">
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
</script>

<PageHeader data-testid="header" title="Databases">
  <svelte:fragment slot="tabs">
    <Tabs>
      <Tab label="Overview" />
      <Tab label="Backups" />
    </Tabs>
  </svelte:fragment>
  <svelte:fragment slot="tabsEnd">
    <button type="button">Last 24 hours</button>
  </svelte:fragment>
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
</PageHeader>
