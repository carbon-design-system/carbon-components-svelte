<script>
  import {
    Button,
    Checkbox,
    ProgressIndicator,
    ProgressStep,
    Stack,
  } from "carbon-components-svelte";

  let selectedId = "step-b";
  let showStepA = true;
  let showStepB = true;
  let showStepC = true;
  let showStepD = true;

  $: visibleSteps = [
    { id: "step-a", label: "Step 1", show: showStepA },
    { id: "step-b", label: "Step 2", show: showStepB },
    { id: "step-c", label: "Step 3", show: showStepC },
    { id: "step-d", label: "Step 4", show: showStepD },
  ].filter((s) => s.show);
</script>

<Stack gap={3}>
  <div>
    <Checkbox bind:checked={showStepA} labelText="Show Step 1" />
    <Checkbox bind:checked={showStepB} labelText="Show Step 2" />
    <Checkbox bind:checked={showStepC} labelText="Show Step 3" />
    <Checkbox bind:checked={showStepD} labelText="Show Step 4" />
  </div>
  <Stack gap={4} orientation="horizontal" align="center">
    <Button
      kind="tertiary"
      size="small"
      on:click={() => (selectedId = "step-c")}
    >
      Select Step 3 by id
    </Button>
    <div><strong>selectedId:</strong> {selectedId}</div>
  </Stack>
  <ProgressIndicator bind:selectedId>
    {#each visibleSteps as step (step.id)}
      <ProgressStep id={step.id} label={step.label} complete />
    {/each}
  </ProgressIndicator>
</Stack>
