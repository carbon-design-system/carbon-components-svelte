<script>
  import {
    Button,
    Checkbox,
    Stack,
    Tab,
    TabContent,
    Tabs,
  } from "carbon-components-svelte";

  let selectedId = "admin";
  let showDashboard = true;
  let showAdmin = true;
  let showSettings = true;
  let showProfile = true;

  $: visibleTabs = [
    { id: "dashboard", label: "Dashboard", show: showDashboard },
    { id: "admin", label: "Admin", show: showAdmin },
    { id: "settings", label: "Settings", show: showSettings },
    { id: "profile", label: "Profile", show: showProfile },
  ].filter((tab) => tab.show);
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
    <div>
      <strong>selectedId:</strong>
      {selectedId}
    </div>
  </Stack>
  <Tabs bind:selectedId>
    {#each visibleTabs as tab (tab.id)}
      <Tab id={tab.id} label={tab.label} />
    {/each}
    <svelte:fragment slot="content">
      {#each visibleTabs as tab (tab.id)}
        <TabContent>
          <p>{tab.label} content</p>
        </TabContent>
      {/each}
    </svelte:fragment>
  </Tabs>
</Stack>
