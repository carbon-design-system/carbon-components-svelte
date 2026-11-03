<script>
  import {
    Button,
    IconPicker,
    Modal,
    toIconItems,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";

  const items = toIconItems({ Add, Calendar, Chat, Home, Settings });

  let open = false;
  let value = "Home";
</script>

<Button on:click={() => (open = true)}>Rename workspace</Button>
<Modal
  bind:open
  modalHeading="Rename workspace"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <IconPicker labelText="Icon" {items} bind:value />
</Modal>
