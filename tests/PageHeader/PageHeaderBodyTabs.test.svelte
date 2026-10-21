<script lang="ts">
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
</script>

<PageHeader data-testid="header" title="Databases">
  <Tabs type="container">
    <Tab label="Daily" />
    <Tab label="Weekly" />
    <svelte:fragment slot="content">
      <TabContent data-testid="daily">Daily panel</TabContent>
      <TabContent data-testid="weekly">Weekly panel</TabContent>
    </svelte:fragment>
  </Tabs>
</PageHeader>
