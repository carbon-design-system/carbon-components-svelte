<script>
  import { Tab, Tabs } from "carbon-components-svelte";
</script>

<!-- Sized container tabs where one tab has a secondary label. -->
{#each ["sm", "xl"] as size}
  <div data-testid="tabs-{size}" style="margin: 1rem;">
    <Tabs type="container" {size}>
      <Tab label="Overview" />
      <Tab label="Alerts" secondaryLabel="12" />
      <Tab label="Settings" />
    </Tabs>
  </div>
{/each}
