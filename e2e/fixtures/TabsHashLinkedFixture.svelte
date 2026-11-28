<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
</script>

<a href="#settings" data-testid="settings-link">Settings</a>
<!-- Puts the tabs below the fold, so a hash on load has to scroll. -->
<div style:height="150vh"></div>
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
