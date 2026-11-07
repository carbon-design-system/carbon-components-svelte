<script>
  import {
    InlineNotification,
    Link,
    ListItem,
    ToastNotification,
    UnorderedList,
  } from "carbon-components-svelte";

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

<InlineNotification
  data-testid="inline-content"
  hideCloseButton
  kind="warning"
  title="Before you migrate"
>
  <UnorderedList><ListItem>Backups are on.</ListItem></UnorderedList>
  <Link href="#runbook">Runbook</Link>
</InlineNotification>

<ToastNotification
  data-testid="toast-content"
  hideCloseButton
  timeout={0}
  kind="warning"
  title="Before you migrate"
>
  <UnorderedList><ListItem>Backups are on.</ListItem></UnorderedList>
  <Link href="#runbook">Runbook</Link>
</ToastNotification>
