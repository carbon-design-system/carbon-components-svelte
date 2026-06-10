<script>
  import {
    Box,
    Dropdown,
    SearchMenu,
    SearchMenuItem,
    Stack,
  } from "carbon-components-svelte";

  let value = "";
  let scopeId = "all";

  const scopeItems = [
    { id: "all", text: "All" },
    { id: "networks", text: "Networks" },
    { id: "devices", text: "Devices" },
  ];

  const scopeConfig = {
    all: {
      placeholder: "Search networks and devices",
      types: ["network", "device"],
    },
    networks: {
      placeholder: "Search private networks",
      types: ["network"],
    },
    devices: {
      placeholder: "Search edge gateways",
      types: ["device"],
    },
  };

  const resources = [
    { id: "gw-01", name: "Edge gateway 01", type: "device" },
    { id: "gw-02", name: "Edge gateway 02", type: "device" },
    { id: "gw-lab", name: "Edge gateway lab", type: "device" },
    { id: "net-us-south", name: "Private network us-south", type: "network" },
    { id: "net-eu-de", name: "Private network eu-de", type: "network" },
    { id: "net-ap-tokyo", name: "Private network ap-tokyo", type: "network" },
  ];

  $: config = scopeConfig[scopeId] ?? scopeConfig.all;
  $: placeholder = config.placeholder;
  $: results = resources.filter((item) => config.types.includes(item.type));
</script>

<SearchMenu bind:value {placeholder} labelText="Search">
  <Stack slot="before" orientation="horizontal" align="stretch" gap={0}>
    <Dropdown
      hideLabel
      size="xl"
      titleText="Scope"
      style="width: 12rem"
      bind:selectedId={scopeId}
      items={scopeItems}
      on:select={() => (value = "")}
    />
    <Box aria-hidden="true" width={1} fill="layer-03" />
  </Stack>

  {#each results as item (item.id)}
    <SearchMenuItem text={item.name} value={item.id} />
  {/each}
</SearchMenu>
