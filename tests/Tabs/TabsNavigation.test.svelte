<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let selected = 0;
</script>

<Tabs navigation aria-label="Component" bind:selected>
  <Tab label="Examples" href="#examples" />
  <Tab label="API" href="#api" />
  <Tab label="Changelog" href="#changelog" disabled />
</Tabs>
<div data-testid="selected">{selected}</div>
