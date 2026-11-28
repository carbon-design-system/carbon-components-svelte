<script>
  import {
    Button,
    ClickableTile,
    Content,
    Header,
    SidePanel,
    Stack,
  } from "carbon-components-svelte";
  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";

  const services = [
    { name: "checkout-api", region: "US East", replicas: 6 },
    { name: "payments-worker", region: "EU Central", replicas: 3 },
    { name: "search-indexer", region: "AP South", replicas: 2 },
    { name: "notifications", region: "US East", replicas: 4 },
  ];

  let open = false;
  let current = 0;
  /** @type {HTMLAnchorElement[]} */
  let tiles = [];

  $: service = services[current];
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Stack orientation="horizontal" gap={4} wrap="wrap">
    {#each services as { name }, index (name)}
      <ClickableTile
        bind:ref={tiles[index]}
        on:click={() => {
          current = index;
          open = true;
        }}
      >
        {name}
      </ClickableTile>
    {/each}
  </Stack>
</Content>

<SidePanel
  bind:open
  labelText="Service"
  titleText={service.name}
  returnFocusTo={() => tiles[current]}
>
  <svelte:fragment slot="headerActions" let:buttonSize>
    <Button
      kind="ghost"
      size={buttonSize}
      icon={ChevronLeft}
      iconDescription="Previous service"
      on:click={() => {
        current = (current - 1 + services.length) % services.length;
      }}
    />
    <Button
      kind="ghost"
      size={buttonSize}
      icon={ChevronRight}
      iconDescription="Next service"
      on:click={() => {
        current = (current + 1) % services.length;
      }}
    />
  </svelte:fragment>
  <p>{service.region}, {service.replicas} replicas.</p>
</SidePanel>
