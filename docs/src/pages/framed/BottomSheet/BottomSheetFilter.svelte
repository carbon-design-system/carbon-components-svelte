<script>
  import {
    BottomSheet,
    Button,
    Checkbox,
    Stack,
  } from "carbon-components-svelte";

  const cuisines = [
    "Bakery",
    "Barbecue",
    "Breakfast",
    "Burgers",
    "Coffee",
    "Dessert",
    "Dim sum",
    "Ice cream",
    "Italian",
    "Japanese",
    "Korean",
    "Mexican",
    "Pizza",
    "Ramen",
    "Salads",
    "Seafood",
    "Thai",
    "Vegan",
  ];

  let open = true;
  let snapPoint;
  let selected = [];
</script>

<Stack gap={4}>
  <Button on:click={() => (open = true)}>Filters</Button>
  <p>{selected.length} selected</p>
</Stack>

<BottomSheet
  bind:open
  bind:snapPoint
  title="Cuisine"
  snapPoints={["half", "full"]}
  breakpoint={false}
>
  <Stack gap={2}>
    {#each cuisines as cuisine}
      <Checkbox
        labelText={cuisine}
        checked={selected.includes(cuisine)}
        on:check={(e) => {
          selected = e.detail
            ? [...selected, cuisine]
            : selected.filter((c) => c !== cuisine);
        }}
      />
    {/each}
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (selected = [])}>Reset</Button>
    <Button on:click={() => (open = false)}>Show results</Button>
  </svelte:fragment>
</BottomSheet>
