<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selected = 0;
</script>

<Tabs data-testid="tabs" bind:selected>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
  <Tab label="Tab 3" />

  <TabContent>
    <p data-testid="tab-content-1">Content for tab 1</p>
  </TabContent>
  <TabContent>
    <p data-testid="tab-content-2">Content for tab 2</p>
  </TabContent>
  <TabContent>
    <p data-testid="tab-content-3">Content for tab 3</p>
  </TabContent>
</Tabs>
