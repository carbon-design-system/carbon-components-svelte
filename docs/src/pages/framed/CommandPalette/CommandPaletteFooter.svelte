<script>
  import { Button, CommandPalette } from "carbon-components-svelte";

  let open = true;

  const items = [
    { id: "deploy", text: "Deploy latest commit" },
    { id: "restart", text: "Restart service" },
    { id: "logs", text: "View logs" },
  ];
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<CommandPalette bind:open {items}>
  <svelte:fragment slot="footer">
    ↑ ↓ to move · Enter to run · Esc to close
  </svelte:fragment>
</CommandPalette>
