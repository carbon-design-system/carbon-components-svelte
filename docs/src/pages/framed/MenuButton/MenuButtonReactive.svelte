<script>
  import {
    Button,
    MenuButton,
    MenuItem,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={6} align="start">
  <MenuButton labelText="Actions" bind:open>
    <MenuItem on:click={() => console.log("Cut")}>Cut</MenuItem>
    <MenuItem on:click={() => console.log("Copy")}>Copy</MenuItem>
    <MenuItem on:click={() => console.log("Paste")}>Paste</MenuItem>
  </MenuButton>
  <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
    {open ? "Close menu" : "Open menu"}
  </Button>
</Stack>
