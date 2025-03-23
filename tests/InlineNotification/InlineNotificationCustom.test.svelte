<script lang="ts">
import {
  InlineNotification,
  NotificationActionButton,
} from "carbon-components-svelte";
</script>

<InlineNotification kind="warning">
  <strong slot="title">Custom Title:</strong>
  <strong slot="subtitle">Custom subtitle content.</strong>
  <svelte:fragment slot="actions">
    <NotificationActionButton>Learn more</NotificationActionButton>
  </svelte:fragment>
</InlineNotification>
