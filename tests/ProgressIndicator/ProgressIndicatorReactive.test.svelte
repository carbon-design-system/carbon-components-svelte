<script lang="ts">
  import { ProgressIndicator, ProgressStep } from "carbon-components-svelte";

  export let step1Complete = false;
  export let step2Complete = false;
</script>

<ProgressIndicator>
  <ProgressStep
    label="Step 1"
    description="First step"
    complete={step1Complete}
  />
  <ProgressStep
    label="Step 2"
    description="Second step"
    complete={step2Complete}
  />
</ProgressIndicator>
