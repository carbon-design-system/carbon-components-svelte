<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
</script>

<Tabs>
  <Tab id="tab-a" label="Tab 1" />
  <Tab id="tab-b" label="Tab 2" />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent id="own-panel">Content 2</TabContent>
  </svelte:fragment>
</Tabs>
