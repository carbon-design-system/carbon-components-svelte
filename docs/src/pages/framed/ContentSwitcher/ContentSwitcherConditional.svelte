<script>
  import {
    Checkbox,
    ContentSwitcher,
    Stack,
    Switch,
  } from "carbon-components-svelte";

  let selectedIndex = 0;
  let showAdmin = true;
  let showSettings = true;
</script>

<Stack gap={3}>
  <div>
    <Checkbox bind:checked={showAdmin} labelText="Show Admin switch" />
    <Checkbox bind:checked={showSettings} labelText="Show Settings switch" />
  </div>
  <div>
    <strong>Selected index:</strong>
    {selectedIndex}
  </div>
  <ContentSwitcher bind:selectedIndex>
    <Switch text="Dashboard" />
    {#if showAdmin}
      <Switch text="Admin" />
    {/if}
    {#if showSettings}
      <Switch text="Settings" />
    {/if}
    <Switch text="Profile" />
  </ContentSwitcher>
</Stack>
