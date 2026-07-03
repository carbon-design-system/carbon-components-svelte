<script>
  import { Button, MenuButton, MenuItem } from "carbon-components-svelte";

  let open = false;
  let selectedAction = "";
</script>

<Button data-testid="open-externally" on:click={() => (open = true)}>
  Open externally
</Button>

<MenuButton labelText="Actions" bind:open>
  <MenuItem on:click={() => (selectedAction = "Cut")}>Cut</MenuItem>
  <MenuItem on:click={() => (selectedAction = "Copy")}>Copy</MenuItem>
  <MenuItem on:click={() => (selectedAction = "Paste")}>Paste</MenuItem>
  <MenuItem labelText="Export as">
    <MenuItem on:click={() => (selectedAction = "PDF")}>PDF</MenuItem>
    <MenuItem on:click={() => (selectedAction = "JPG")}>JPG</MenuItem>
    <MenuItem on:click={() => (selectedAction = "PNG")}>PNG</MenuItem>
  </MenuItem>
</MenuButton>

{#if selectedAction}
  <p data-testid="selected-action">Selected: {selectedAction}</p>
{/if}
