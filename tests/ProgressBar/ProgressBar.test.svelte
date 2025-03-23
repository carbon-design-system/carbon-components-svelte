<script lang="ts">
import { ProgressBar } from "carbon-components-svelte";
</script>

<ProgressBar status="active" data-testid="indeterminate-progress" />

<ProgressBar helperText="Loading..." />

<ProgressBar
  value={40}
  max={100}
  labelText="Progress 40%"
  data-testid="progress-40%"
/>

<ProgressBar size="sm" value={60} data-testid="small-progress" />

<ProgressBar size="md" value={60} data-testid="medium-progress" />

<ProgressBar kind="inline" value={40} data-testid="inline-progress" />

<ProgressBar kind="indented" value={40} data-testid="indented-progress" />

<ProgressBar status="error" value={40} data-testid="error-progress" />

<ProgressBar status="finished" value={100} data-testid="finished-progress" />

<ProgressBar labelText="Hidden label" hideLabel value={50} />

<ProgressBar value={150} max={100} data-testid="over-max" />

<ProgressBar value={-10} data-testid="under-zero" />
