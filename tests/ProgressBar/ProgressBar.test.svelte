<script lang="ts">
  import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";
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

<ProgressBar status="active" value={5} max={0} data-testid="zero-max" />

<ProgressBar
  labelText="Upload"
  value={40}
  valueText="40 MB of 100 MB"
  data-testid="value-text"
/>

<ProgressBar
  labelText="Upload"
  status="error"
  value={40}
  valueText="Failed at 40 MB"
  data-testid="value-text-error"
/>

<ProgressBar labelText="Upload" value={40} data-testid="no-value-text" />

<ProgressBar
  labelText="Hidden upload label"
  hideLabel
  value={40}
  valueText="40 MB of 100 MB"
  data-testid="hidden-label-value-text"
/>

<ProgressBar
  labelText="Rich upload value"
  value={40}
  valueText="40 MB of 100 MB"
  data-testid="value-children"
>
  <strong slot="valueChildren">40 MB / 100 MB</strong>
</ProgressBar>

<ProgressBar
  labelText="Whitespace value"
  value={40}
  valueText="   "
  data-testid="whitespace-value-text"
/>
