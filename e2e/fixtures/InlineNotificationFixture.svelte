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
