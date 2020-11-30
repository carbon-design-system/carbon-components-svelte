<script>
  import { Button, Tabs, Tab, TabContent } from "carbon-components-svelte";

  let selected = 0;
</script>

<style>
  div {
    margin: var(--cds-layout-02) 0;
  }
</style>

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
  <Button
    size="small"
    disabled="{selected === 1}"
    on:click="{() => {
      selected = 1;
    }}"
  >
    Set selected index to 1
  </Button>
</div>

<div>Selected index: {selected}</div>
