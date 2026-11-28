<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
</script>

<Tabs hashLinked>
  <Tab id="overview" label="Overview" />
  <Tab id="activity" label="Activity" />
  <Tab id="settings" label="Settings" />
  <svelte:fragment slot="content">
    <TabContent>Overview content</TabContent>
    <TabContent>Activity content</TabContent>
    <TabContent>Settings content</TabContent>
  </svelte:fragment>
</Tabs>
