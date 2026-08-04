<script>
  import {
    Button,
    Checkbox,
    ContentSwitcher,
    Stack,
    Switch,
  } from "carbon-components-svelte";

  let selectedId = "admin";
  let showDashboard = true;
  let showAdmin = true;
  let showSettings = true;
  let showProfile = true;

  $: visibleSwitches = [
    { id: "dashboard", text: "Dashboard", show: showDashboard },
    { id: "admin", text: "Admin", show: showAdmin },
    { id: "settings", text: "Settings", show: showSettings },
    { id: "profile", text: "Profile", show: showProfile },
  ].filter((s) => s.show);
</script>

<Stack gap={3}>
  <div>
    <Checkbox bind:checked={showDashboard} labelText="Show Dashboard" />
    <Checkbox bind:checked={showAdmin} labelText="Show Admin" />
    <Checkbox bind:checked={showSettings} labelText="Show Settings" />
    <Checkbox bind:checked={showProfile} labelText="Show Profile" />
  </div>
  <Stack gap={4} orientation="horizontal" align="center">
    <Button
      kind="tertiary"
      size="small"
      on:click={() => (selectedId = "settings")}
    >
      Select Settings by id
    </Button>
    <div><strong>selectedId:</strong> {selectedId}</div>
  </Stack>
  <ContentSwitcher bind:selectedId>
    {#each visibleSwitches as sw (sw.id)}
      <Switch id={sw.id} text={sw.text} />
    {/each}
  </ContentSwitcher>
</Stack>
