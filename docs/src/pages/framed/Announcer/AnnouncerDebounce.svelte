<script>
  import {
    announce,
    ListItem,
    Stack,
    TextInput,
    UnorderedList,
  } from "carbon-components-svelte";

  const regions = [
    "Dallas",
    "Frankfurt",
    "London",
    "Madrid",
    "Osaka",
    "Sao Paulo",
    "Sydney",
    "Tokyo",
    "Toronto",
    "Washington DC",
  ];

  let value = "";
  let typed = false;

  $: matches = regions.filter((region) =>
    region.toLowerCase().includes(value.trim().toLowerCase()),
  );

  // Said once typing pauses for 500 ms, with the count at that moment.
  $: if (typed) {
    announce(matches.length === 1 ? "1 region" : `${matches.length} regions`, {
      channel: "regions",
      debounce: 500,
    });
  }
</script>

<Stack gap={5}>
  <TextInput
    labelText="Filter regions"
    bind:value
    on:input={() => (typed = true)}
  />
  <UnorderedList>
    {#each matches as region (region)}
      <ListItem>{region}</ListItem>
    {/each}
  </UnorderedList>
</Stack>
