<script>
  import {
    Button,
    Menu,
    MenuItem,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";

  let anchor;
  let open = false;
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu">
  <MenuItem labelText="Deploy" on:click={() => console.log("Deploy")}>
    <svelte:fragment slot="labelChildren">
      Deploy
      <TooltipIcon
        align="start"
        tooltipText="Deploys the latest build to production."
        icon={Information}
      />
    </svelte:fragment>
  </MenuItem>
  <MenuItem on:click={() => console.log("View details")}>
    View details
  </MenuItem>
</Menu>
