<script>
  import {
    ListItem,
    Search,
    Stack,
    UnorderedList,
  } from "carbon-components-svelte";

  const services = [
    "Cloud Functions",
    "Cloud Object Storage",
    "Code Engine",
    "Event Streams",
    "Key Protect",
    "Secrets Manager",
  ];

  let value = "";

  $: query = value.trim().toLowerCase();
  $: matches = services.filter((service) =>
    service.toLowerCase().includes(query),
  );

  function describeResults(count) {
    if (count === 0) return "No services match";
    return count === 1 ? "1 service matches" : `${count} services match`;
  }
</script>

<Stack gap={5}>
  <Search
    bind:value
    labelText="Filter services"
    placeholder="Filter services"
    resultsDescription={query ? describeResults(matches.length) : ""}
  />
  <UnorderedList>
    {#each matches as service (service)}
      <ListItem>{service}</ListItem>
    {/each}
  </UnorderedList>
</Stack>
