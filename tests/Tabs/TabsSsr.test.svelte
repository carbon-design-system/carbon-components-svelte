<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let selected: number | undefined = undefined;
  export let selectedId: string | undefined = undefined;
</script>

<Tabs {...selected === undefined ? {} : { selected }} {selectedId}>
  <Tab id="tab-a" label="Tab 1" />
  <Tab id="tab-b" label="Tab 2" />
  <Tab id="tab-c" label="Tab 3" />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</Tabs>
