<script>
  import {
    Button,
    ComboButton,
    MenuItem,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={6} align="start">
  <ComboButton labelText="Save" bind:open>
    <MenuItem on:click={() => console.log("Save as")}>Save as</MenuItem>
    <MenuItem on:click={() => console.log("Save a copy")}>Save a copy</MenuItem>
  </ComboButton>
  <Button kind="tertiary" size="small" on:click={() => (open = !open)}>
    {open ? "Close menu" : "Open menu"}
  </Button>
</Stack>
