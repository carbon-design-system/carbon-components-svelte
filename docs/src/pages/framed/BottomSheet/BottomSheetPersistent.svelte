<script>
  import {
    BottomSheet,
    Button,
    ContainedList,
    ContainedListItem,
    Search,
    Stack,
  } from "carbon-components-svelte";

  const places = [
    "Ferry Building",
    "Dolores Park",
    "Golden Gate Park",
    "Lands End",
    "Mission Dolores",
    "Oracle Park",
    "Palace of Fine Arts",
    "Presidio",
    "Salesforce Park",
    "Twin Peaks",
    "Union Square",
    "Washington Square",
  ];

  let query = "";
  let recentered = 0;
  $: results = places.filter((place) =>
    place.toLowerCase().includes(query.toLowerCase()),
  );
</script>

<Stack gap={4}>
  <Button kind="tertiary" on:click={() => (recentered += 1)}
    >Recenter map</Button
  >
  <p>
    Map recentered {recentered} times. The page behind the sheet stays usable.
  </p>
</Stack>

<BottomSheet
  open
  modal={false}
  dismissible={false}
  title="Nearby"
  snapPoints={["peek", "half", "full"]}
  breakpoint={false}
>
  <Stack gap={4}>
    <Search
      labelText="Search places"
      placeholder="Search places"
      bind:value={query}
    />
    <ContainedList labelText="Places" hideLabel>
      {#each results as place}
        <ContainedListItem>{place}</ContainedListItem>
      {/each}
    </ContainedList>
  </Stack>
</BottomSheet>
