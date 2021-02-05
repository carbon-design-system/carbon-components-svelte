<script>
  import { Tabs, Tab, TabContent, Button } from "carbon-components-svelte";

  let selected = 0;
</script>

<Tabs bind:selected>
  <Tab label="Tab label 1" />
  <Tab label="Tab label 2" />
  <Tab label="Tab label 3" />
  <div slot="content">
    <TabContent>Content 1</TabContent>
    <TabContent>Content 2</TabContent>
    <TabContent>Content 3</TabContent>
  </div>
</Tabs>

<div>
  <h4>Selected index: {selected}</h4>
</div>

<div>
  <Button
    size="small"
    disabled="{selected === 1}"
    on:click="{() => (selected = 1)}"
  >
    Set index to 1
  </Button>
</div>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }
</style>
