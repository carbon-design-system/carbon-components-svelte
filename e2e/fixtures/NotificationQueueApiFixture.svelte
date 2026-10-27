<script>
  import { NotificationQueue } from "carbon-components-svelte";
  import NotificationQueueApiButtons from "./NotificationQueueApiButtons.svelte";

  const params = new URLSearchParams(location.search);
  const lowContrast = params.has("lowContrast");
</script>

<NotificationQueue maxNotifications={4}>
  <NotificationQueueApiButtons {lowContrast} />
</NotificationQueue>
