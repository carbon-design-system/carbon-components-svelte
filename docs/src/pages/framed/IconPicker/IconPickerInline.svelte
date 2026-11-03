<script>
  import { IconPicker, Stack, toIconItems } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const items = toIconItems({
    Add,
    Calendar,
    Chat,
    Edit,
    Home,
    Save,
    Settings,
    TrashCan,
  });

  let value = "Settings";
</script>

<Stack gap={5}>
  <IconPicker variant="inline" labelText="Workspace icon" {items} bind:value />
  <p>Chosen: <code>{value}</code></p>
</Stack>
