<script>
  import {
    Button,
    CommandPalette,
    Layer,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let open = true;

  const items = [
    { id: "deploy", text: "Deploy latest commit", shortcut: "mod+shift+d" },
    { id: "restart", text: "Restart service" },
    { id: "scale", text: "Scale instances", description: "2 instances" },
  ];
</script>

<Tile>
  <Stack gap={5}>
    <p>checkout-api</p>
    <Layer>
      <Tile>
        <Button on:click={() => (open = true)}>Open command palette</Button>
        <CommandPalette bind:open {items} />
      </Tile>
    </Layer>
  </Stack>
</Tile>
