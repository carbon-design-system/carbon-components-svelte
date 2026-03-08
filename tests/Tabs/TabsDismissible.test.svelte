<script lang="ts">
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
  import Calendar from "../../src/icons/Calendar.svelte";

  export let dismissible = true;
  export let disabled = true;
</script>

<Tabs
  {dismissible}
  on:dismiss={({ detail }) => {
    console.log("dismiss event", detail);
  }}
  on:change={({ detail }) => {
    console.log("change event", detail);
  }}
>
  <Tab label="Dashboard" icon={Calendar} />
  <Tab label="Monitoring" />
  <Tab label="Settings" {disabled} />
  <svelte:fragment slot="content">
    <TabContent>Dashboard content</TabContent>
    <TabContent>Monitoring content</TabContent>
    <TabContent>Settings content</TabContent>
  </svelte:fragment>
</Tabs>
