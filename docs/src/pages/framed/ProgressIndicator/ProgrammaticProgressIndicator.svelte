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
      label="Build"
      description="Build completed successfully"
    />
    <ProgressStep
      complete
      label="Test"
      description="Automated test suite passed"
    />
    <ProgressStep
      complete
      bind:current={thirdStepCurrent}
      label="Stage"
      description="Deploying to the staging environment"
    />
    <ProgressStep
      label="Deploy"
      description="Waiting to release to production"
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
