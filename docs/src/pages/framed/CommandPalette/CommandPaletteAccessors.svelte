<script>
  import { Button, CommandPalette, Stack } from "carbon-components-svelte";

  let open = true;
  let selected = "";

  // Data as an API returns it, with no `id`, `text` or `group` fields.
  const services = [
    { serviceId: "srv-1", name: "checkout-api", team: "Payments" },
    { serviceId: "srv-2", name: "billing-worker", team: "Payments" },
    { serviceId: "srv-3", name: "search-indexer", team: "Discovery" },
    { serviceId: "srv-4", name: "recommendations", team: "Discovery" },
  ];
</script>

<Stack gap={5}>
  <Button on:click={() => (open = true)}>Find a service</Button>
  {#if selected}
    <p>Selected: {selected}</p>
  {/if}
</Stack>

<CommandPalette
  bind:open
  items={services}
  itemToId={(service) => service.serviceId}
  itemToString={(service) => service.name}
  itemToGroup={(service) => service.team}
  placeholder="Find a service"
  labelText="Find a service"
  on:select={(event) => (selected = event.detail.id)}
/>
