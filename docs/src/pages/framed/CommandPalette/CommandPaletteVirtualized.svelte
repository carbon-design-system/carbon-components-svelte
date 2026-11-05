<script>
  import { Button, CommandPalette } from "carbon-components-svelte";

  let open = true;

  const regions = ["Oregon", "Ohio", "Virginia", "Frankfurt", "Singapore"];
  const items = Array.from({ length: 10_000 }, (_, index) => ({
    id: index,
    text: `service-${String(index).padStart(5, "0")}`,
    group: regions[index % regions.length],
  }));
</script>

<Button on:click={() => (open = true)}>Find one of 10,000 services</Button>

<CommandPalette
  bind:open
  {items}
  placeholder="Find a service"
  labelText="Find a service"
/>
