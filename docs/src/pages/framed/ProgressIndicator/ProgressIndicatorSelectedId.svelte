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
    { id: "step-a", label: "Build", show: showStepA },
    { id: "step-b", label: "Test", show: showStepB },
    { id: "step-c", label: "Stage", show: showStepC },
    { id: "step-d", label: "Deploy", show: showStepD },
  ].filter((s) => s.show);
</script>

<Stack gap={3}>
  <div>
    <Checkbox bind:checked={showStepA} labelText="Show Build step" />
    <Checkbox bind:checked={showStepB} labelText="Show Test step" />
    <Checkbox bind:checked={showStepC} labelText="Show Stage step" />
    <Checkbox bind:checked={showStepD} labelText="Show Deploy step" />
  </div>
  <Stack gap={4} orientation="horizontal" align="center">
    <Button
      kind="tertiary"
      size="small"
      on:click={() => (selectedId = "step-c")}
    >
      Select the Stage step by id
    </Button>
    <div><strong>selectedId:</strong> {selectedId}</div>
  </Stack>
  <ProgressIndicator bind:selectedId>
    {#each visibleSteps as step (step.id)}
      <ProgressStep id={step.id} label={step.label} complete />
    {/each}
  </ProgressIndicator>
</Stack>
