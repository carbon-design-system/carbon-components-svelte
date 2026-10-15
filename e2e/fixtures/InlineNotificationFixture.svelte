<script>
  import { InlineNotification } from "carbon-components-svelte";

  let open = true;
</script>

<InlineNotification
  data-testid="inline-notification"
  kind="info"
  title="Notification title"
  subtitle="Notification subtitle"
  bind:open
/>

<div data-testid="notification-wide" style:width="1200px">
  <InlineNotification
    fullWidth
    hideCloseButton
    role="status"
    kind="warning"
    title="Usage"
    subtitle="Build minutes are close to the Team limit."
  />
</div>

<div data-testid="notification-narrow" style:width="240px">
  <InlineNotification
    fullWidth
    hideCloseButton
    role="status"
    kind="error"
    title="Payment failed"
    subtitle="Update your card."
  />
</div>

<div data-testid="notification-default" style:width="1200px">
  <InlineNotification
    hideCloseButton
    role="status"
    kind="info"
    title="Maintenance"
    subtitle="Sunday 02:00 UTC"
  />
</div>
