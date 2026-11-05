<script>
  import { Button, CommandPalette } from "carbon-components-svelte";

  let open = true;

  const items = [
    { id: "deploy", text: "Deploy latest commit" },
    { id: "restart", text: "Restart service" },
  ];
</script>

<Button on:click={() => (open = true)}>Open command palette</Button>

<CommandPalette
  bind:open
  {items}
  value="database"
  noResultsText={(value) => `No commands match "${value}"`}
/>
