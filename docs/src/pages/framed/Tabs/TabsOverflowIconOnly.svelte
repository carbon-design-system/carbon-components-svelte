<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";
  import Activity from "carbon-icons-svelte/lib/Activity.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Analytics from "carbon-icons-svelte/lib/Analytics.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Dashboard from "carbon-icons-svelte/lib/Dashboard.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Email from "carbon-icons-svelte/lib/Email.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";

  const items = [
    { label: "Dashboard", icon: Dashboard },
    { label: "Activity", icon: Activity },
    { label: "Analytics", icon: Analytics },
    { label: "Calendar", icon: Calendar },
    { label: "Chat", icon: Chat },
    { label: "Documents", icon: Document },
    { label: "Email", icon: Email },
    { label: "Files", icon: Folder },
    { label: "Information", icon: Information },
    { label: "Notifications", icon: Notification },
    { label: "Search", icon: Search },
    { label: "Add", icon: Add },
  ];
</script>

<Tabs iconOnly>
  {#each items as item}
    <Tab label={item.label} icon={item.icon} />
  {/each}
  <svelte:fragment slot="content">
    {#each items as item}
      <TabContent>{item.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
