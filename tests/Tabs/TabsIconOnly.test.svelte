<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import type { ComponentProps } from "svelte";
  import Calendar from "../../src/icons/Calendar.svelte";
  import Information from "../../src/icons/Information.svelte";
  import Settings from "../../src/icons/Settings.svelte";

  export let iconOnly: ComponentProps<Tabs>["iconOnly"] = true;
  export let iconSize: ComponentProps<Tabs>["iconSize"] = "default";
  export let tooltipAlignment: ComponentProps<Tab>["tooltipAlignment"] =
    "center";
  export let disabledFirst = false;
</script>

<Tabs {iconOnly} {iconSize}>
  <Tab label="Calendar" icon={Calendar} disabled={disabledFirst} />
  <Tab label="Settings" icon={Settings} {tooltipAlignment} />
  <Tab label="Information" icon={Information} />
  <svelte:fragment slot="content">
    <TabContent>Calendar content</TabContent>
    <TabContent>Settings content</TabContent>
    <TabContent>Information content</TabContent>
  </svelte:fragment>
</Tabs>
