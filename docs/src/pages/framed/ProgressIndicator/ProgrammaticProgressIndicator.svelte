<script>
  import {
    ProgressIndicator,
    ProgressStep,
    Button,
  } from "carbon-components-svelte";

  let currentIndex = 1;
  let thirdStepComplete = false;
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
    complete="{thirdStepComplete}"
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
    on:click="{() => {
      currentIndex = 2;
    }}"
  >
    Set index to 2
  </Button>
  <Button
    kind="ghost"
    on:click="{() => {
      thirdStepComplete = !thirdStepComplete;
    }}"
  >
    Toggle step 3
  </Button>
</div>

<h3>Current index: {currentIndex}</h3>
