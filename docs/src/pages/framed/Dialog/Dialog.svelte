<script>
  import { Button, Dialog } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open dialog</Button>

<Dialog
  bind:open
  modal
  aria-label="Example dialog"
  on:open={() => console.log("open")}
  on:close={() => console.log("close")}
>
  <p>Dialog content.</p>
  <Button on:click={() => (open = false)}>Close</Button>
</Dialog>
