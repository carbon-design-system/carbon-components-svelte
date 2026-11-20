<script>
  import { Stack, UnitInput } from "carbon-components-svelte";

  let weight = 1234.5;
  let share = 42;
  let timeout = 1500;
  let storage = 512;
  let speed = 90;
</script>

<Stack gap={4}>
  <UnitInput bind:value={weight} labelText="Weight" unit="kg" />
  <UnitInput bind:value={share} labelText="Share" unit="%" />
  <UnitInput bind:value={timeout} labelText="Timeout" unit="ms" />
  <UnitInput bind:value={storage} labelText="Storage" unit="GB" />
  <UnitInput
    bind:value={speed}
    labelText="Speed"
    unit="kilometer-per-hour"
    unitDisplay="long"
  />
</Stack>
