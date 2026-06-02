<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
</script>

<Tabs>
  <Tab label="Tab 1" disabled />
  <Tab label="Tab 2" disabled />
  <Tab label="Tab 3" disabled />
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</Tabs>
