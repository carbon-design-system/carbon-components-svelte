<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";

  type Service = { key: string; name: string; team: string };

  const items: Service[] = [
    { key: "svc-1", name: "checkout-api", team: "Payments" },
    { key: "svc-2", name: "billing-worker", team: "Payments" },
    { key: "svc-3", name: "search-indexer", team: "Discovery" },
  ];

  let selected = "";
</script>

<CommandPalette
  open
  {items}
  itemToId={(item) => item.key}
  itemToString={(item) => item.name}
  itemToGroup={(item) => item.team}
  on:select={(event) => (selected = event.detail.id)}
/>
<span data-testid="selected">{selected}</span>
