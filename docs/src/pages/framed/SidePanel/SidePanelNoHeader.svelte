<script>
  import { Button, SidePanel } from "carbon-components-svelte";

  let open = true;
</script>

<Button on:click={() => (open = true)}>View service</Button>

<SidePanel bind:open title="checkout-api">
  <p>Node.js web service in US East, on the Standard plan.</p>
</SidePanel>
