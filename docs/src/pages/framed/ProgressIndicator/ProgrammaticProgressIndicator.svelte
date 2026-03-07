<script>
  import {
    Button,
    ProgressIndicator,
    ProgressStep,
    Stack,
  } from "carbon-components-svelte";

  let currentIndex = 1;
  let thirdStepCurrent = false;
</script>

<Stack gap={6}>
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
  <Stack gap={4}>
    <div>
      <Button
        kind={currentIndex === 2 ? "secondary" : "primary"}
        size="small"
        on:click={() => {
          currentIndex = currentIndex === 2 ? 0 : 2;
        }}
      >
        Set currentIndex to
        {currentIndex === 2 ? 0 : 2}
      </Button>
    </div>
    <div>
      <strong>Current index:</strong>
      {currentIndex}
    </div>
    <div>
      <strong>Is the third step currently selected?</strong>
      {thirdStepCurrent}
    </div>
  </Stack>
</Stack>
