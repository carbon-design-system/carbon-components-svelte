<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let selected = 0;
</script>

<TabsVertical navigation aria-label="Settings" bind:selected>
  <Tab label="Profile" href="#profile" />
  <Tab label="Security" href="#security" />
  <Tab label="Billing" href="#billing" disabled />
  <div slot="content" data-testid="page">Page {selected}</div>
</TabsVertical>
