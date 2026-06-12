<script>
  import { BadgeIndicator, Button, Stack } from "carbon-components-svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";

  const notifications = 1200;
  const messages = 2_500_000;

  function formatCount(value) {
    return value.toLocaleString(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }
</script>

<Stack orientation="horizontal" gap={7}>
  <Button
    kind="ghost"
    icon={Notification}
    iconDescription="Notifications"
    tooltipAlignment="start"
  >
    <BadgeIndicator slot="badge" count={formatCount(notifications)} />
  </Button>
  <Button kind="ghost" icon={Notification} iconDescription="Notifications">
    <BadgeIndicator slot="badge" count={formatCount(messages)} />
  </Button>
  <Button kind="ghost" icon={Notification} iconDescription="Notifications">
    <BadgeIndicator slot="badge" count="99+" />
  </Button>
</Stack>
