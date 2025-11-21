<script>
  import { Checkbox, Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selected = 0;
  let showAdminTab = true;
  let showSettingsTab = true;
</script>

<Checkbox bind:checked={showAdminTab} labelText="Show Admin tab" />
<Checkbox bind:checked={showSettingsTab} labelText="Show Settings tab" />

<div
  style:margin-top="var(--cds-layout-01)"
  style:margin-bottom="var(--cds-layout-02)"
>
  <strong>Selected index:</strong>
  {selected}
</div>

<Tabs bind:selected>
  <Tab label="Dashboard" />
  {#if showAdminTab}
    <Tab label="Admin" />
  {/if}
  {#if showSettingsTab}
    <Tab label="Settings" />
  {/if}
  <Tab label="Profile" />
  <svelte:fragment slot="content">
    <TabContent>
      <p>Dashboard content with analytics and overview.</p>
    </TabContent>
    {#if showAdminTab}
      <TabContent>
        <p>Admin panel for managing users and permissions.</p>
      </TabContent>
    {/if}
    {#if showSettingsTab}
      <TabContent>
        <p>Settings and configuration options.</p>
      </TabContent>
    {/if}
    <TabContent>
      <p>User profile and account information.</p>
    </TabContent>
  </svelte:fragment>
</Tabs>
