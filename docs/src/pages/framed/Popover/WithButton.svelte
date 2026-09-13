<script>
  import { Button, Popover } from "carbon-components-svelte";

  let open = true;
  let ref = null;
</script>

<div bind:this={ref} style:position="relative">
  <Button on:click={() => (open = !open)}>Quick settings</Button>
  <Popover
    bind:open
    align="bottom-left"
    on:click:outside={({ detail }) => {
      console.log("on:click:outside");
      open = ref.contains(detail.target);
    }}
  >
    Adjust table density and default sort order for this workspace.
  </Popover>
</div>
