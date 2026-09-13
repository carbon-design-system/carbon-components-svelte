<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const labels = [
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

  const items = labels.map((label, i) => ({
    label,
    secondaryLabel: `(${i + 1}/12)`,
  }));
</script>

<Tabs type="container">
  {#each items as item}
    <Tab label={item.label} secondaryLabel={item.secondaryLabel} />
  {/each}
  <svelte:fragment slot="content">
    {#each items as item}
      <TabContent>{item.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
