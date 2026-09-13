<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const items = [
    "Dashboard",
    "Monitoring",
    "Activity",
    "Settings",
    "Reports",
    "Billing",
    "Users",
    "Security",
    "Integrations",
    "Notifications",
    "Webhooks",
    "Audit logs",
  ];
</script>

<Tabs>
  {#each items as item}
    <Tab label={item} />
  {/each}
  <svelte:fragment slot="content">
    {#each items as item}
      <TabContent>{item} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
