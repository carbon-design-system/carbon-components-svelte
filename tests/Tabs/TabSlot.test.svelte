<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<Tabs>["selected"] = 0;
</script>

<Tabs {selected}>
  <Tab label="Tab 1" let:selected>
    <span data-testid="tab-0" data-selected={selected}>Tab 1</span>
  </Tab>
  <Tab label="Tab 2" let:selected>
    <span data-testid="tab-1" data-selected={selected}>Tab 2</span>
  </Tab>
  <Tab label="Tab 3" let:selected>
    <span data-testid="tab-2" data-selected={selected}>Tab 3</span>
  </Tab>
  <svelte:fragment slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </svelte:fragment>
</Tabs>
