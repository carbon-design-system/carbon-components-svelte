<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
</script>

<ProgressIndicator>
  <ProgressStep complete label="Step 1" {...$$restProps} />
  <ProgressStep label="Step 2" />
</ProgressIndicator>
