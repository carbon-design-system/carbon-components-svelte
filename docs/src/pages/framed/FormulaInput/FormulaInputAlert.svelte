<script>
  import {
    FormulaInput,
    NumberInput,
    Stack,
    Tag,
  } from "carbon-components-svelte";

  const fields = [
    { id: "error_rate", label: "Error rate", type: "number" },
    { id: "latency_ms", label: "p95 latency (ms)", type: "number" },
    { id: "region", label: "Region", type: "string" },
  ];

  let errorRate = 0.08;
  let latency = 940;
  let value =
    '{error_rate} > 0.05 and ({latency_ms} > 800 or region = "eu-west")';
  let result;

  $: row = { error_rate: errorRate, latency_ms: latency, region: "us-east" };
</script>

<Stack gap={5}>
  <FormulaInput
    bind:value
    bind:result
    {fields}
    {row}
    previewLabel="Fires"
    labelText="Alert condition"
    helperText="The alert fires when the condition is true"
  />
  <Stack gap={5} orientation="horizontal">
    <NumberInput
      bind:value={errorRate}
      labelText="Error rate"
      step={0.01}
      min={0}
      max={1}
    />
    <NumberInput bind:value={latency} labelText="p95 latency (ms)" step={50} />
  </Stack>
  {#if result?.ok}
    <Tag type={result.value ? "red" : "green"}
      >{result.value ? "Alert fires" : "No alert"}</Tag
    >
  {/if}
</Stack>
