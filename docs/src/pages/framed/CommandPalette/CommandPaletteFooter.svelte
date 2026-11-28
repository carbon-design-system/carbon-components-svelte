<script>
  import { Button, CommandPalette, Kbd, Stack } from "carbon-components-svelte";

  let open = true;

  const items = [
    { id: "deploy", text: "Deploy latest commit" },
    { id: "restart", text: "Restart service" },
    { id: "logs", text: "View logs" },
  ];
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<CommandPalette bind:open {items}>
  <Stack slot="footer" orientation="horizontal" gap={5}>
    <span
      ><Kbd variant="muted" shortcut="arrowup" />
      <Kbd variant="muted" shortcut="arrowdown" /> to move</span
    >
    <span><Kbd variant="muted" shortcut="enter" /> to run</span>
    <span><Kbd variant="muted" shortcut="escape" /> to close</span>
  </Stack>
</CommandPalette>
