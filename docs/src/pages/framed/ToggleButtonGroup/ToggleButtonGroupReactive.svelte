<script>
  import {
    Button,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
  } from "carbon-components-svelte";

  let selected = ["bold"];
</script>

<Stack gap={6} align="start">
  <ToggleButtonGroup labelText="Text formatting" bind:selected>
    <ToggleButton value="bold">Bold</ToggleButton>
    <ToggleButton value="italic">Italic</ToggleButton>
    <ToggleButton value="underline">Underline</ToggleButton>
  </ToggleButtonGroup>
  <p>Selected: {selected.join(", ") || "none"}</p>
  <Button kind="tertiary" size="small" on:click={() => (selected = [])}>
    Clear selection
  </Button>
</Stack>
