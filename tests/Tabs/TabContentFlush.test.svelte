<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
</script>

<Tabs>
  <Tab label="Flush" />
  <Tab label="Default" />
  <svelte:fragment slot="content">
    <TabContent flush>Flush panel</TabContent>
    <TabContent>Default panel</TabContent>
  </svelte:fragment>
</Tabs>
