<script lang="ts">
  import { ToastNotification } from "carbon-components-svelte";
</script>

<ToastNotification kind="warning">
  <strong slot="titleChildren">Custom Title:</strong>
  <strong slot="subtitleChildren">Custom subtitle content.</strong>
  <strong slot="captionChildren">Custom caption content.</strong>
</ToastNotification>
