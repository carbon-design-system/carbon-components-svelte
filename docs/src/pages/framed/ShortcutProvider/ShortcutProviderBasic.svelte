<script>
  import {
    Button,
    Kbd,
    shortcut,
    ShortcutProvider,
    Stack,
  } from "carbon-components-svelte";

  let message = "Press a shortcut";

  function run(text) {
    message = text;
  }
</script>

<ShortcutProvider
  shortcuts={[
    {
      keys: "mod+k",
      label: "Open command palette",
      onTrigger: () => run("Opened the command palette"),
    },
  ]}
>
  <Stack gap={5}>
    <Stack orientation="horizontal" gap={5} align="center">
      <div
        use:shortcut={{
          keys: "mod+s",
          label: "Save draft",
          onTrigger: () => run("Saved the draft"),
        }}
      >
        <Button on:click={() => run("Saved the draft")}>Save draft</Button>
      </div>
      <Kbd shortcut="mod+s" />
      <Kbd shortcut="mod+k" />
    </Stack>
    <p aria-live="polite">{message}</p>
  </Stack>
</ShortcutProvider>
