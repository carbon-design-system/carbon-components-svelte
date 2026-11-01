<script>
  import { Button, CommandPalette, Stack, Tag } from "carbon-components-svelte";

  let open = true;

  const items = [
    { id: "checkout", text: "checkout-api", region: "Oregon", status: "Live" },
    {
      id: "billing",
      text: "billing-worker",
      region: "Frankfurt",
      status: "Live",
    },
    {
      id: "search",
      text: "search-indexer",
      region: "Ohio",
      status: "Suspended",
    },
  ];
</script>

<Button on:click={() => (open = true)}>Find a service</Button>

<CommandPalette
  bind:open
  {items}
  value="er"
  placeholder="Find a service"
  labelText="Find a service"
  let:item
  let:segments
>
  <Stack
    orientation="horizontal"
    gap={3}
    align="center"
    justify="space-between"
  >
    <span
      >{#each segments as segment, index (index)}
        {#if segment.match}
          <strong>{segment.text}</strong>
        {:else}
          {segment.text}
        {/if}
      {/each}
      · {item.region}</span
    >
    <Tag size="sm" type={item.status === "Live" ? "green" : "gray"}>
      {item.status}
    </Tag>
  </Stack>
</CommandPalette>
