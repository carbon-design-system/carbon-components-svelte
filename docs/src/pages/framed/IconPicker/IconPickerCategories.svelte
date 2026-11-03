<script>
  import { Box, IconPicker, toIconItems } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Email from "carbon-icons-svelte/lib/Email.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import User from "carbon-icons-svelte/lib/User.svelte";

  const categoryOf = {
    Add: "actions",
    Edit: "actions",
    Save: "actions",
    TrashCan: "actions",
    Chat: "communication",
    Email: "communication",
    Notification: "communication",
    Calendar: "workspace",
    Home: "workspace",
    Settings: "workspace",
    User: "workspace",
  };

  const items = toIconItems(
    {
      Add,
      Calendar,
      Chat,
      Edit,
      Email,
      Home,
      Notification,
      Save,
      Settings,
      TrashCan,
      User,
    },
    { category: (id) => categoryOf[id] },
  );

  let value;
</script>

<Box maxWidth="20rem">
  <IconPicker
    labelText="Icon"
    {items}
    categories={[
      { id: "actions", label: "Actions" },
      { id: "communication", label: "Communication" },
      { id: "workspace", label: "Workspace" },
    ]}
    bind:value
  />
</Box>
