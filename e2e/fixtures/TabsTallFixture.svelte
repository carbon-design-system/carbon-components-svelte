<script>
  import { Tab, Tabs, TabsVertical } from "carbon-components-svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
</script>

<!-- Container tabs where one tab has a secondary label. -->
{#each [undefined, "sm", "xl"] as size}
  <div data-testid="tabs-{size ?? 'default'}" style="margin: 1rem;">
    <Tabs type="container" {size}>
      <Tab label="Overview" />
      <Tab label="Alerts" secondaryLabel="12" />
      <Tab label="Calendar" icon={Calendar} />
    </Tabs>
  </div>
{/each}
<div data-testid="vertical" style="margin: 1rem; height: 16rem;">
  <TabsVertical>
    <Tab label="Overview" />
    <Tab label="Alerts" secondaryLabel="12" />
  </TabsVertical>
</div>
