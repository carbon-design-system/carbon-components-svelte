<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
</script>

<ProgressIndicator data-testid="scalar-default">
  <ProgressStep label="Step 1" />
</ProgressIndicator>

<ProgressIndicator vertical data-testid="scalar-vertical">
  <ProgressStep label="Step 1" />
</ProgressIndicator>

<ProgressIndicator
  vertical={{ sm: true, md: false }}
  data-testid="object-vertical"
>
  <ProgressStep label="Step 1" />
</ProgressIndicator>
