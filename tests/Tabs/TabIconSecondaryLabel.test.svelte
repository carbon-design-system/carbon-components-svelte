<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Calendar from "../../src/icons/Calendar.svelte";
  import Information from "../../src/icons/Information.svelte";
  import Settings from "../../src/icons/Settings.svelte";
</script>

<Tabs type="container">
  <Tab label="Calendar" icon={Calendar} secondaryLabel="(12 events)" />
  <Tab label="Information" icon={Information} secondaryLabel="(3 new)" />
  <Tab label="Settings" icon={Settings} secondaryLabel="(2 pending)" disabled />
  <svelte:fragment slot="content">
    <TabContent>Calendar content</TabContent>
    <TabContent>Information content</TabContent>
    <TabContent>Settings content</TabContent>
  </svelte:fragment>
</Tabs>
