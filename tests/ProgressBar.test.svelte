<script lang="ts">
  import { ProgressBar } from "../types";
</script>

<ProgressBar helperText="Loading..." />

<ProgressBar
  kind="inline"
  size="md"
  value="{40}"
  max="{100}"
  labelText="Upload status"
  hideLabel
  helperText="40 MB of 100 MB"
  status="finished"
/>
