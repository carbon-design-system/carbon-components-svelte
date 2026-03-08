<script>
  import { ProgressIndicator, ProgressStep } from "carbon-components-svelte";

  let currentIndex = 0;
</script>

<div data-testid="current-index" data-current={currentIndex}>
  <ProgressIndicator data-testid="progress-indicator" bind:currentIndex>
    <ProgressStep label="First step" description="Step 1" complete={true} />
    <ProgressStep label="Second step" description="Step 2" complete={true} />
    <ProgressStep label="Third step" description="Step 3" complete={true} />
    <ProgressStep label="Fourth step" description="Step 4" complete={true} />
  </ProgressIndicator>
</div>
