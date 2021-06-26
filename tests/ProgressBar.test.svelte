<script>
  import { ProgressBar } from "../types";
</script>

<ProgressBar helperText="Loading..." />

<ProgressBar
  value="{40}"
  labelText="Upload status"
  helperText="40 MB of 100 MB"
/>

<ProgressBar
  value="{40}"
  max="{200}"
  labelText="Upload status"
  helperText="40 MB of 100 MB"
/>

<ProgressBar
  hideLabel
  value="{40}"
  labelText="Upload status"
  helperText="40 MB of 100 MB"
/>
