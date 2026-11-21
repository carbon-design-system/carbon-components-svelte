<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Calendar from "../../../src/icons/Calendar.svelte";
</script>

<Tabs iconOnly>
  <Tab label="Calendar" icon={Calendar} />
  <svelte:fragment slot="content">
    <TabContent>Calendar content</TabContent>
  </svelte:fragment>
</Tabs>
