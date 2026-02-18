<script>
  import {
    Button,
    RadioButton,
    RadioButtonGroup,
    Stack,
  } from "carbon-components-svelte";

  const plans = ["Free (1 GB)", "Standard (10 GB)", "Pro (128 GB)"];

  let plan = plans[1];
</script>

<RadioButtonGroup
  legendText="Storage tier (disk)"
  name="plan"
  bind:selected={plan}
>
  {#each plans as value (value)}
    <RadioButton labelText={value} {value} />
  {/each}
</RadioButtonGroup>

<Stack gap={4}>
  <div>
    {#each plans as value (value)}
      <Button
        size="small"
        kind="secondary"
        disabled={plan === value}
        on:click={() => (plan = value)}
      >
        Select "{value}"
      </Button>
    {/each}
  </div>
  <div>
    Selected plan:
    <strong>{plan}</strong>
  </div>
</Stack>
