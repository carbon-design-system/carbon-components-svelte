<script lang="ts">
import { ToastNotification } from "carbon-components-svelte";
</script>

<ToastNotification kind="warning">
  <strong slot="title">Custom Title:</strong>
  <strong slot="subtitle">Custom subtitle content.</strong>
  <strong slot="caption">Custom caption content.</strong>
</ToastNotification>
