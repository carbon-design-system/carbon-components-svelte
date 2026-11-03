<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";
</script>

<TabsVertical>
  <Tab label="One" modified />
  <Tab label="Two" />
  <svelte:fragment slot="content">
    <TabContent>One content</TabContent>
    <TabContent>Two content</TabContent>
  </svelte:fragment>
</TabsVertical>
