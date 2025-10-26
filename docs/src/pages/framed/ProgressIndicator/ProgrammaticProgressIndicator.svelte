<script>
  import {
    Button,
    ProgressIndicator,
    ProgressStep,
  } from "carbon-components-svelte";

  let currentIndex = 1;
  let thirdStepCurrent = false;
</script>

<ProgressIndicator bind:currentIndex>
  <ProgressStep
    complete
    label="Step 1"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    complete
    label="Step 2"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    complete
    bind:current={thirdStepCurrent}
    label="Step 3"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Step 4"
    description="The progress indicator will listen for clicks on the steps"
  />
</ProgressIndicator>

<div style="margin: var(--cds-layout-02) 0">
  <Button
    kind={currentIndex === 2 ? "secondary" : "primary"}
    on:click={() => {
      currentIndex = currentIndex === 2 ? 0 : 2;
    }}
  >
    Set currentIndex to
    {currentIndex === 2 ? 0 : 2}
  </Button>
</div>

<h3>Current index: {currentIndex}</h3>

<div>Is the third step currently selected? {thirdStepCurrent}</div>
