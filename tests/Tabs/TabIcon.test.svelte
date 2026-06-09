<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabContent from "carbon-components-svelte/Tabs/TabContent.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";
  import Calendar from "../../src/icons/Calendar.svelte";

  export let icon = Calendar;
  export let disabled = false;
  export let label = "Test Tab";
</script>

<Tabs>
  <Tab {label} {icon} {disabled} />
  <Tab label="No Icon" />
  <svelte:fragment slot="content">
    <TabContent>Icon content</TabContent>
    <TabContent>Plain content</TabContent>
  </svelte:fragment>
</Tabs>
