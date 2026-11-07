<script>
  import {
    Button,
    shortcut,
    ShortcutHelp,
    ShortcutProvider,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<ShortcutProvider
  shortcuts={[
    {
      keys: "mod+k",
      label: "Open command palette",
      onTrigger: () => {},
    },
  ]}
>
  <ShortcutHelp bind:open />
  <Stack orientation="horizontal" gap={5} align="center">
    <div
      use:shortcut={{
        keys: "mod+shift+f",
        label: "Filter incidents",
        onTrigger: () => {},
      }}
    >
      <Button kind="secondary">Filter incidents</Button>
    </div>
    <Button kind="ghost" on:click={() => (open = true)}>Show shortcuts</Button>
  </Stack>
</ShortcutProvider>
