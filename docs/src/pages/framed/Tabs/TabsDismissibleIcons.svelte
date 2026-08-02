<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  let selectedId = "dashboard";
  let tabs = [
    { id: "dashboard", label: "Dashboard", icon: Dashboard },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings, disabled: true },
  ];

  function handleDismiss({ detail }) {
    tabs = tabs.filter((tab) => tab.id !== detail.id);
  }
</script>

<Tabs bind:selectedId dismissible on:dismiss={handleDismiss}>
  {#each tabs as tab (tab.id)}
    <Tab
      id={tab.id}
      label={tab.label}
      icon={tab.icon}
      disabled={tab.disabled}
    />
  {/each}
  <svelte:fragment slot="content">
    {#each tabs as tab (tab.id)}
      <TabContent>{tab.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
