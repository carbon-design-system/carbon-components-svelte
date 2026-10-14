<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Calendar from "../../src/icons/Calendar.svelte";

  export let iconOnly = false;
  export let tabProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<div id="external-panel">External panel</div>
<Tabs {iconOnly}>
  <Tab label="Calendar" icon={Calendar} data-testid="tab-item" {...tabProps} />
  <Tab label="Settings" icon={Calendar} />
  <svelte:fragment slot="content">
    <TabContent>Calendar content</TabContent>
    <TabContent>Settings content</TabContent>
  </svelte:fragment>
</Tabs>
