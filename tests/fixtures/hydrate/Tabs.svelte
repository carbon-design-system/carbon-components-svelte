<script>
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
</script>

<!-- A secondary label on one tab: siblings render the same on the
  server and in the browser, since none of them reads the others. -->
<Tabs type="container">
  <Tab label="Overview" />
  <Tab label="Alerts" secondaryLabel="(12 new)" />
  <Tab label="Settings" />
  <svelte:fragment slot="content">
    <TabContent>Overview</TabContent>
    <TabContent>Alerts</TabContent>
    <TabContent>Settings</TabContent>
  </svelte:fragment>
</Tabs>
<TabsVertical>
  <Tab label="Overview" />
  <Tab label="Alerts" secondaryLabel="(12 new)" />
  <svelte:fragment slot="content">
    <TabContent>Overview</TabContent>
    <TabContent>Alerts</TabContent>
  </svelte:fragment>
</TabsVertical>
