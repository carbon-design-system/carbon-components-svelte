<script>
  import { ProgressBar } from "carbon-components-svelte";
</script>

<div style="width: 400px; display: grid; gap: 2rem;">
  {#each ["default", "inline", "indented"] as kind}
    <ProgressBar
      data-testid="hidden-label-{kind}"
      {kind}
      value={40}
      hideLabel
      labelText="Sync progress"
      helperText="40 of 100 records synced"
    />
  {/each}
</div>
