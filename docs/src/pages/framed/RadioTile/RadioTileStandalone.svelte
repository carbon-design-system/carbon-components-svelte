<script>
  import { RadioTile, Stack } from "carbon-components-svelte";

  const cycles = [
    { value: "monthly", label: "Monthly billing" },
    { value: "annual", label: "Annual billing (2 months free)" },
  ];

  // One `checked` per tile; tiles sharing a `name` uncheck each other.
  let checked = [true, false];

  $: selected = cycles.find((_, i) => checked[i]);
</script>

<Stack gap={5}>
  <Stack gap={3}>
    {#each cycles as cycle, i}
      <RadioTile
        name="billing-cycle"
        value={cycle.value}
        bind:checked={checked[i]}
      >
        {cycle.label}
      </RadioTile>
    {/each}
  </Stack>
  <div>Selected: <strong>{selected?.label ?? "None"}</strong></div>
</Stack>
